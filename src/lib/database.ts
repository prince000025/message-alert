import { supabase, isSupabaseConfigured } from './supabase'
import type { AnalysisResult, ThreatIntelResult, FeatureVector } from './analyzer'

export interface ScanRecord extends AnalysisResult {
  id: string
}

const STORAGE_KEY = 'phishguard_scan_history_v1'

function getLocalScans(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to read from localStorage:', err)
    return []
  }
}

function saveLocalScans(scans: ScanRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans))
  } catch (err) {
    console.error('Failed to write to localStorage:', err)
  }
}

export async function saveScan(result: AnalysisResult): Promise<void> {
  const localRecord: ScanRecord = {
    ...result,
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  }

  // Always save locally to ensure scan history works seamlessly
  const existing = getLocalScans().filter((s) => s.input !== localRecord.input)
  saveLocalScans([localRecord, ...existing].slice(0, 50))

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('scan_history').insert({
        input_text: result.input,
        input_type: result.inputType,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        findings: result.findings,
        summary: result.summary,
        features: result.features,
        threat_intel: result.threatIntel,
        confidence: result.confidence,
      })
      if (error) {
        console.warn('Failed to save scan to Supabase:', error.message)
      }
    } catch (e) {
      console.warn('Supabase save error:', e)
    }
  }
}

export async function getScanHistory(limit = 50): Promise<ScanRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        const remoteRecords: ScanRecord[] = (data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          input: row.input_text as string,
          inputType: row.input_type as 'url' | 'message',
          riskScore: row.risk_score as number,
          riskLevel: row.risk_level as AnalysisResult['riskLevel'],
          findings: row.findings as AnalysisResult['findings'],
          summary: row.summary as string,
          scannedAt: (row.created_at as string) || new Date().toISOString(),
          features: (row.features as FeatureVector[]) || [],
          threatIntel: (row.threat_intel as ThreatIntelResult | null) || null,
          confidence: (row.confidence as number) ?? 0.5,
        }))
        saveLocalScans(remoteRecords)
        return remoteRecords
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local storage:', err)
    }
  }

  return getLocalScans().slice(0, limit)
}

export async function deleteScan(id: string): Promise<void> {
  const updated = getLocalScans().filter((r) => r.id !== id)
  saveLocalScans(updated)

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('scan_history').delete().eq('id', id)
      if (error) {
        console.warn('Failed to delete scan from Supabase:', error.message)
      }
    } catch (e) {
      console.warn('Supabase delete error:', e)
    }
  }
}

export async function checkThreatIntel(url: string, hostname: string): Promise<ThreatIntelResult | null> {
  // If Supabase edge function is configured, attempt it
  if (isSupabaseConfigured) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/threat-check`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url, hostname }),
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.error) {
          return data as ThreatIntelResult
        }
      }
    } catch {
      // Fall through to client-side threat intel
    }
  }

  // Client-side fallback check using public DNS-over-HTTPS (Google DoH)
  try {
    const dohResp = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
      { headers: { Accept: 'application/dns-json' } }
    )
    if (dohResp.ok) {
      const dohData = await dohResp.json()
      const sources: string[] = []
      const details: string[] = []
      let threatType: string | null = null
      let confidence: 'low' | 'medium' | 'high' = 'low'

      if (dohData.Status === 3) {
        sources.push('DNS Resolution (Google DoH)')
        threatType = 'non-existent domain'
        confidence = 'high'
        details.push('Domain does not resolve (NXDOMAIN) — may be parked or fraudulent')
      } else if (dohData.Answer) {
        const ips = dohData.Answer
          .filter((a: { type: number }) => a.type === 1)
          .map((a: { data: string }) => a.data)
        if (ips.length > 0) {
          details.push(`Resolves to: ${ips.join(', ')}`)
        }
      }

      if (sources.length > 0) {
        return {
          flagged: true,
          sources,
          threatType,
          confidence,
          details: details.join('\n'),
        }
      }
    }
  } catch {
    // Network lookup failure is non-critical
  }

  return null
}
