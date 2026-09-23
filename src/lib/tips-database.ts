export interface SecurityTip {
  id: string
  category: 'sms' | 'calls' | 'urls' | 'banking' | 'delivery' | 'impersonation' | 'emergency'
  categoryLabel: string
  title: string
  severity: 'critical' | 'high' | 'pro-tip'
  summary: string
  redFlags: string[]
  actionDo: string[]
  actionDont: string[]
  realWorldExample: string
  quickTakeaway: string
  keywords: string[]
}

export const SECURITY_TIPS: SecurityTip[] = [
  // --- EMERGENCY & FIRST AID TIPS ---
  {
    id: 'emergency-clicked-link',
    category: 'emergency',
    categoryLabel: 'Emergency Protocol',
    title: 'What to Do Immediately If You Clicked a Suspicious Link',
    severity: 'critical',
    summary: 'Acting within the first 5 minutes can stop credentials theft, session hijacking, or malicious malware installation in its tracks.',
    redFlags: [
      'Page asks you to re-enter your password, PIN, or OTP unexpectedly',
      'Browser downloads an .apk, .exe, or profile without your explicit request',
      'The address bar changes to an unfamiliar domain name or raw IP address',
    ],
    actionDo: [
      'Immediately turn on Airplane Mode or disconnect Wi-Fi and Mobile Data to halt active data exfiltration or malware downloads.',
      'If you typed in a password, quickly use a different, clean device to change the password on that service and terminate all active sessions.',
      'Clear your browser cache, cookies, and local site storage for the past 24 hours.',
      'Check your device Downloads folder for any unauthorized .apk or configuration files and delete them without opening.',
    ],
    actionDont: [
      'Do NOT submit an OTP or 2FA code if the page asks after clicking.',
      'Do NOT grant "Accessibility", "Device Admin", or "Install from Unknown Sources" permissions if prompted.',
      'Do NOT ignore it hoping nothing happened—prompt containment prevents account drain.',
    ],
    realWorldExample: 'You clicked a fake "Order Delayed" SMS link. The page loaded a login box asking for your Apple ID or Google password with a download spinner.',
    quickTakeaway: 'Disconnect internet immediately -> change password from another device -> review downloaded files.',
    keywords: ['clicked', 'link', 'accident', 'airplane mode', 'emergency', 'compromised', 'hacked'],
  },
  {
    id: 'emergency-shared-otp',
    category: 'emergency',
    categoryLabel: 'Emergency Protocol',
    title: 'Emergency Steps If You Disclosed an OTP or Banking Info',
    severity: 'critical',
    summary: 'A stolen OTP gives scammers instantaneous access to drain bank accounts or register your phone number on rogue devices.',
    redFlags: [
      'SMS text says "Do not share with anyone including bank staff"',
      'Incoming transaction alert for an amount or merchant you never authorized',
      'Caller stays on the line insisting "Please read the 6-digit confirmation code"',
    ],
    actionDo: [
      'Open your mobile banking app directly or call the official fraud hotline on the physical back of your debit/credit card to freeze cards and netbanking.',
      'Request an immediate freeze on UPI / fast-payment IDs associated with your mobile number.',
      'File an official cybercrime complaint on your national portal (e.g., cybercrime.gov.in or ic3.gov) with the transaction reference.',
      'Take screenshots of the SMS, call history, and fraudulent transaction for evidence.',
    ],
    actionDont: [
      'Do NOT call back the number that just sent you the SMS.',
      'Do NOT search Google for bank helpline numbers (scammers buy fake Google Ads at the top of search results).',
      'Do NOT wait until the next morning—card freeze hotlines operate 24/7.',
    ],
    realWorldExample: '"Dear customer, enter OTP 829104 to authorize debit of $850 at Target." Caller claims: "I am stopping this charge, just read the OTP to cancel it."',
    quickTakeaway: 'Banks NEVER ask for OTPs to cancel a transaction. Call the number on the back of your card immediately.',
    keywords: ['otp', 'bank', 'stolen', 'unauthorized', 'freeze card', 'drain', 'emergency'],
  },

  // --- SMS & SMISHING TIPS ---
  {
    id: 'sms-sender-id-spoofing',
    category: 'sms',
    categoryLabel: 'SMS & Smishing',
    title: 'How Attackers Spoof Legitimate SMS Sender Headers',
    severity: 'critical',
    summary: 'Scammers exploit telecom SMS gateway loopholes to put names like "CHASE", "AMAZON", or "FEDEX" as the sender, making fraudulent SMS appear in the same thread as genuine bank messages.',
    redFlags: [
      'SMS arrives inside your official bank conversation thread but contains an external shortened URL',
      'The message demands urgent action to avoid account suspension within 1 to 24 hours',
      'The tone is alarmist and threatens severe penalties, service cutoff, or legal action',
    ],
    actionDo: [
      'Always ignore links inside SMS messages, even if the sender header looks official.',
      'Navigate to the bank or service by typing the official address directly in your browser or opening their verified app.',
      'Check if the SMS includes non-standard country codes or strange hyphenations.',
    ],
    actionDont: [
      'Do NOT assume an SMS is authentic just because your phone grouped it under "Chase" or "Wells Fargo".',
      'Do NOT reply with "STOP" or "NO" to unsolicited scam messages—this verifies your phone number is active.',
    ],
    realWorldExample: 'A message inside your real "HDFC-BANK" or "CITI" thread saying: "PAN card not linked. Account blocked. Click http://hdfc-pancard-update.in to unfreeze."',
    quickTakeaway: 'SMS headers can be spoofed. Never trust a link simply because it landed in a trusted SMS thread.',
    keywords: ['spoof', 'header', 'sender id', 'thread', 'bank sms', 'smishing', 'pan'],
  },
  {
    id: 'sms-urgency-threats',
    category: 'sms',
    categoryLabel: 'SMS & Smishing',
    title: 'Spotting Artificial Urgency & Fear Tactics',
    severity: 'high',
    summary: 'The number one psychological weapon in phishing is artificial urgency: forcing your brain into panic mode so you react before thinking critically.',
    redFlags: [
      'Phrases like "Action Required in 2 Hours", "Account Will Be Terminated", or "Arrest Warrant Issued"',
      'Threat of electricity / power disconnection tonight at 9:30 PM due to unpaid bill',
      'Threat of SIM card deactivation or WhatsApp number revocation within 24 hours',
    ],
    actionDo: [
      'Take a 60-second deep breath: legitimate utility companies and banks provide written postal notices and grace periods before termination.',
      'Check your actual utility or phone bill on your provider\'s official mobile app or billing portal.',
      'Use Truecaller Shield\'s analyzer to inspect the message text and links before deciding.',
    ],
    actionDont: [
      'Do NOT call the mobile number given in the "urgent disconnection" SMS.',
      'Do NOT install any remote support tool (like QuickSupport or AnyDesk) sent by the caller.',
    ],
    realWorldExample: '"Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Contact Officer at 98765-XXXXX."',
    quickTakeaway: 'Urgency is manufactured panic. Real utility cutoffs follow formal notices, never same-day SMS threats.',
    keywords: ['urgency', 'fear', 'electricity', 'disconnection', 'suspended', 'panic', 'deadline'],
  },
  {
    id: 'sms-lottery-gift-cards',
    category: 'sms',
    categoryLabel: 'SMS & Smishing',
    title: 'Unsolicited Prizes, Lotteries, and Shopping Vouchers',
    severity: 'high',
    summary: 'Scams offering free iPhones, unexpected tax refunds, or $1,000 gift cards are designed to harvest credit cards for "shipping/processing" fees or steal logins.',
    redFlags: [
      'You won a contest, lucky draw, or lottery that you never entered',
      'Requires a small "processing fee", "customs clearance", or "activation charge" ($1.99 or $4.99)',
      'Offers high-value items (MacBook, iPhone 16) for completing a 30-second survey',
    ],
    actionDo: [
      'Ask yourself: "Did I buy a ticket or enter this giveaway?" If not, it is 100% a scam.',
      'Report the message as spam to your mobile carrier (forward to 7726 / SPAM).',
      'Block the sender immediately.',
    ],
    actionDont: [
      'Do NOT enter your credit card number for a "free trial" or "$1 delivery fee".',
      'Do NOT forward the message to friends or family even if the page promises bonus entries.',
    ],
    realWorldExample: '"CONGRATULATIONS! Your mobile number won 2nd prize in the National Shoppers Draw ($50,000). Claim within 24 hours at http://claim-prize-draw.live/win"',
    quickTakeaway: 'You cannot win a contest you never entered. "$1 shipping" requests are credit card subscription traps.',
    keywords: ['lottery', 'prize', 'gift card', 'winner', 'claim', 'free iphone', 'reward'],
  },
  {
    id: 'sms-wrong-number-pig-butchering',
    category: 'sms',
    categoryLabel: 'SMS & Smishing',
    title: '"Wrong Number" & Friendly Stranger Romance Scams',
    severity: 'high',
    summary: 'A seemingly polite accidental SMS ("Hi Sophie, are we still meeting for lunch tomorrow?") is often the hook for a multi-week financial or crypto fraud (Sha Zhu Pan / Pig Butchering).',
    redFlags: [
      'Friendly stranger text apologizing: "Oh sorry, I must have typed the wrong number!"',
      'The sender quickly tries to keep chatting, compliments your kindness, and asks to move to WhatsApp/Telegram',
      'Eventually brings up high-yield cryptocurrency trading, uncle in finance, or insider gold signals',
    ],
    actionDo: [
      'Simply delete the message or ignore it completely.',
      'If you already replied "wrong number", stop all further conversation when they try to be friendly.',
    ],
    actionDont: [
      'Do NOT continue chatting with strangers who reach you via "accidental" SMS.',
      'Do NOT accept investment or financial platform recommendations from internet contacts you haven\'t met in person.',
    ],
    realWorldExample: '"Hi John, the golf reservation is confirmed for 2 PM. See you there!" When you reply wrong number: "Oh so sorry! You are very polite though, I am Jessica from Seattle..."',
    quickTakeaway: 'Friendly "wrong numbers" that steer into personal chat are scripted scam syndicates. Do not engage.',
    keywords: ['wrong number', 'pig butchering', 'crypto', 'romance', 'telegram', 'whatsapp', 'friendly'],
  },

  // --- CALLS & VISHING (VOICE PHISHING) TIPS ---
  {
    id: 'calls-law-enforcement-arrest',
    category: 'calls',
    categoryLabel: 'Calls & Vishing',
    title: 'Fake Police, FBI, Customs & "Digital Arrest" Threats',
    severity: 'critical',
    summary: 'Scammers pose as federal officers, customs agents, or police claiming a parcel containing narcotics or illegal passports was seized in your name.',
    redFlags: [
      'Caller claims to be from Police, Customs, FBI, or Interpol and orders you not to disconnect',
      'Demands you stay on a Skype / WhatsApp video call showing a fake police station background ("Digital Arrest")',
      'Demands you transfer your savings to a "RBI / Government Verification Safe Account" to verify innocence',
    ],
    actionDo: [
      'Hang up immediately. No legitimate law enforcement agency conducts official investigations via WhatsApp video calls.',
      'Remember: Police and courts NEVER ask citizens to transfer money to a "safety account" or "clearing wallet".',
      'Verify by visiting your local police station in person if you have any genuine concerns.',
    ],
    actionDont: [
      'Do NOT share Aadhaar, SSN, passport numbers, or bank account balances over a phone call.',
      'Do NOT comply with orders to isolate yourself in a room or keep the call secret from family.',
    ],
    realWorldExample: 'Caller with aggressive tone: "This is Inspector Sharma from Crime Branch. A DHL package sent to Taiwan with 5 passports and contraband has your identity attached. You are under digital arrest."',
    quickTakeaway: 'Police never conduct trials on video calls or ask you to transfer funds to "safety accounts". Hang up.',
    keywords: ['police', 'arrest', 'customs', 'fbi', 'digital arrest', 'illegal parcel', 'drugs', 'vishing'],
  },
  {
    id: 'calls-bank-fraud-department-spoof',
    category: 'calls',
    categoryLabel: 'Calls & Vishing',
    title: 'Impersonation of Bank Fraud & Anti-Theft Desks',
    severity: 'critical',
    summary: 'The caller sounds calm, professional, and pretends to be helping you stop a fraudulent charge, but is actually trying to harvest your 2FA code or authorization.',
    redFlags: [
      'Caller asks: "Did you just authorize an $890 charge in Florida?" and offers to reverse it',
      'Caller instructs: "I am sending a one-time code to cancel this; please read it to me"',
      'Caller asks you to verify your full 16-digit debit card number and CVV',
    ],
    actionDo: [
      'Say "I will hang up and call the bank directly through the phone number on my card."',
      'Check your official mobile banking app independently to see if any real charges are pending.',
    ],
    actionDont: [
      'Do NOT read out any OTP or verification code sent to your phone.',
      'Do NOT accept an incoming transfer or approve a push notification in your banking app during the call.',
    ],
    realWorldExample: '"Hello Mr. Smith, this is Visa Fraud Prevention. We have flagged suspicious activity on your card. To decline the transaction, please confirm the 6-digit code we just dispatched."',
    quickTakeaway: 'Real fraud agents never ask you for OTPs or CVVs over the phone. Hang up and dial the card back.',
    keywords: ['bank fraud', 'anti-theft', 'card security', 'cvv', 'reverse charge', 'impersonator'],
  },
  {
    id: 'calls-tech-support-remote-access',
    category: 'calls',
    categoryLabel: 'Calls & Vishing',
    title: 'Tech Support Scams & Remote Screen Control',
    severity: 'critical',
    summary: 'Scammers claim your computer or mobile phone is infected with trojans or generating errors, and trick you into installing remote desktop software.',
    redFlags: [
      'Caller claims to be from Microsoft, Apple, or Google Tech Support',
      'Instructs you to install AnyDesk, TeamViewer, RustDesk, or QuickSupport on your PC or phone',
      'Directs you to open the Event Viewer or Terminal and claims standard system logs are "dangerous hacker viruses"',
    ],
    actionDo: [
      'Hang up. Tech companies like Microsoft and Apple NEVER make unsolicited calls to fix personal devices.',
      'If you already installed a remote tool, immediately disconnect Wi-Fi, uninstall the tool, and restart in safe mode.',
    ],
    actionDont: [
      'NEVER grant screen sharing or accessibility permissions to an unexpected caller.',
      'Do NOT log into your bank while a screen-sharing session is active—the caller can record credentials or black out your screen while draining funds.',
    ],
    realWorldExample: '"This is Microsoft Windows Support. We detected your computer is uploading illegal data to the dark web. Download this security fix from help-support-online.net."',
    quickTakeaway: 'Microsoft/Apple never cold-call users about virus infections. Never install AnyDesk for callers.',
    keywords: ['anydesk', 'teamviewer', 'tech support', 'remote access', 'microsoft', 'apple', 'virus'],
  },

  // --- URLS, LINKS & DOMAIN TIPS ---
  {
    id: 'urls-typosquatting-lookalike',
    category: 'urls',
    categoryLabel: 'URLs & Links',
    title: 'Detecting Typosquatting & Lookalike Domains',
    severity: 'high',
    summary: 'Attackers register domains with deliberate typos or visual twins (e.g. replacing lowercase "l" with number "1", or "m" with "rn") to deceive your eyes.',
    redFlags: [
      'Slight misspelling in brand name: "paypa1.com", "arnazon.com", "micros0ft.com"',
      'Hyphenated brand names: "chase-login-verify.com" instead of "chase.com"',
      'Extra subdomains: "paypal.com.auth-secure-node.net" where the REAL domain is "auth-secure-node.net"',
    ],
    actionDo: [
      'Look at the text immediately before the last dot and top-level domain: in "chase.com.security.xyz", the domain is "security.xyz", NOT Chase!',
      'Use bookmarks or search engine results for primary services rather than clicking links.',
      'Paste any suspicious URL into Truecaller Shield\'s analyzer to check its real root domain.',
    ],
    actionDont: [
      'Do NOT rely on small phone screens where the address bar truncates the end of long URLs.',
      'Do NOT assume that seeing a padlock icon means the website belongs to the real brand.',
    ],
    realWorldExample: 'A SMS link pointing to "https://www.netflix.com-billing-update.cc/login" which appears to have netflix.com at the start but leads to .cc.',
    quickTakeaway: 'The real domain is always the word directly before the last extension (e.g., .com or .org), not the subdomains at the front.',
    keywords: ['typosquatting', 'domain', 'subdomain', 'lookalike', 'url', 'homoglyph', 'padlock'],
  },
  {
    id: 'urls-https-misconception',
    category: 'urls',
    categoryLabel: 'URLs & Links',
    title: 'The "HTTPS Padlock" Myth: HTTPS Does Not Equal Safe',
    severity: 'high',
    summary: 'Over 80% of modern phishing sites now use valid HTTPS encryption with green padlocks because free SSL certificates (Let\'s Encrypt) are automated and free.',
    redFlags: [
      'Believing a site is legitimate merely because the browser shows a padlock or "https://"',
      'Phishing sites using HTTPS to transmit stolen passwords securely to the attacker\'s server',
    ],
    actionDo: [
      'Remember: HTTPS only means your connection to the server is encrypted. It does NOT guarantee the server belongs to the genuine company.',
      'Always verify the exact spelling of the domain name regardless of HTTPS presence.',
    ],
    actionDont: [
      'Never lower your guard just because a website has an SSL certificate or padlock.',
    ],
    realWorldExample: 'A phishing site "https://secure-login-apple-id.top" displays a perfect HTTPS padlock icon in Chrome, yet is 100% a fake credential harvesting trap.',
    quickTakeaway: 'Padlock = encrypted connection, NOT authentic owner. Phishers get free SSL certificates in seconds.',
    keywords: ['https', 'ssl', 'padlock', 'encryption', 'certificate', 'safe myth'],
  },
  {
    id: 'urls-shortened-masked-links',
    category: 'urls',
    categoryLabel: 'URLs & Links',
    title: 'Unmasking Shortened & Obfuscated Links (bit.ly, t.co, is.gd)',
    severity: 'high',
    summary: 'Attackers use public URL shortening services to hide the real destination domain, bypassing basic spam filters and human inspection.',
    redFlags: [
      'SMS from an alleged bank or courier containing a bit.ly, tinyurl.com, rb.gy, or ow.ly link',
      'Links with random alphanumeric characters like "https://cutt.ly/xK9dF"',
    ],
    actionDo: [
      'Use a URL unshortener or expander (or inspect it with Truecaller Shield) before visiting.',
      'If an SMS claims to be your bank, go directly to your bank app instead of tapping any short link.',
    ],
    actionDont: [
      'Do NOT tap shortened links sent from unknown numbers or unverified promotional SMS.',
    ],
    realWorldExample: '"USPS: We tried to deliver your parcel but nobody was home. Update your address at https://is.gd/usps_hold within 12 hours."',
    quickTakeaway: 'Legitimate banks and official agencies rarely use generic free shorteners like bit.ly for critical account notices.',
    keywords: ['shortener', 'bitly', 'tinyurl', 'masked link', 'expand url', 'redirect'],
  },

  // --- BANKING, UPI & FINANCIAL TIPS ---
  {
    id: 'banking-qr-code-receive-money',
    category: 'banking',
    categoryLabel: 'Banking & UPI',
    title: 'The QR Code Rule: Scanning a QR Code Only SENDS Money',
    severity: 'critical',
    summary: 'One of the most widespread scams on marketplace platforms (Craigslist, Facebook Marketplace, OLX) tricks sellers into scanning a QR code under the guise of "receiving payment".',
    redFlags: [
      'A buyer insists: "Scan this QR code and enter your UPI PIN to receive money into your bank account"',
      'A QR code image says "Payee: Receive Amount $250 / Enter PIN to Confirm Receipt"',
    ],
    actionDo: [
      'Memorize this golden rule: You NEVER need to scan a QR code or enter your PIN/password to RECEIVE money.',
      'Receiving money requires only your account number or phone number / UPI handle—no interaction or PIN is ever needed.',
    ],
    actionDont: [
      'NEVER enter your UPI PIN, banking password, or card CVV after scanning any QR code.',
      'Do NOT accept payment requests that say "Collect Request" or "Debit Approval".',
    ],
    realWorldExample: 'You list a sofa for $150. Buyer messages: "I will pay advance. Scan this QR code on PayPal/Venmo/GPay to receive $150 now." Scanning it actually sends $150 to the scammer.',
    quickTakeaway: 'Entering a PIN ALWAYS debits money from your account. You NEVER enter a PIN to receive cash.',
    keywords: ['qr code', 'upi', 'receive money', 'scan', 'pin', 'marketplace', 'olx', 'venmo'],
  },
  {
    id: 'banking-crypto-seed-phrase',
    category: 'banking',
    categoryLabel: 'Banking & UPI',
    title: 'Protecting Crypto Wallet 12/24-Word Seed Phrases',
    severity: 'critical',
    summary: 'Your Secret Recovery Phrase (12 or 24 words) is the master key to all your crypto assets. Anyone with those words can drain your wallet in seconds with zero chargebacks or recovery possible.',
    redFlags: [
      'Any website, customer support agent, or Discord bot asking for your 12-word seed phrase',
      'Messages saying "Sync your wallet with the new protocol node to avoid asset freeze"',
      'Google search ads for MetaMask, Phantom, or TrustWallet leading to replica domains',
    ],
    actionDo: [
      'Store your seed phrase offline on physical paper or stamped metal stored in a secure fireproof location.',
      'Only enter your recovery phrase when restoring a fresh hardware wallet or official extension from the verified app store.',
    ],
    actionDont: [
      'NEVER type your seed phrase into any web form, Google Drive, email draft, or screenshot saved in iCloud/Photos.',
      'NEVER share it with someone claiming to be "MetaMask / Ledger Support". No support team will EVER request it.',
    ],
    realWorldExample: 'Email: "MetaMask Regulatory KYC Compliance: Update your wallet identity at metamask-auth.net by entering your 12-word recovery phrase or your balance will be burned."',
    quickTakeaway: 'Whoever holds the seed phrase owns the wallet. Legitimate crypto apps NEVER ask you to type your seed phrase online.',
    keywords: ['crypto', 'seed phrase', 'metamask', 'wallet drainer', 'private key', 'recovery phrase'],
  },
  {
    id: 'banking-fake-refund-overpayment',
    category: 'banking',
    categoryLabel: 'Banking & UPI',
    title: 'Fake Refund & Overpayment Scams',
    severity: 'high',
    summary: 'The scammer claims they accidentally refunded you $4,000 instead of $400, modifies your browser HTML in a screen-sharing session to fake your balance, and begs you to return the difference.',
    redFlags: [
      'Refund email for a service you never bought (Geek Squad, McAfee, Norton $499 renewal)',
      'A phone agent who asks you to type the refund amount and then screams "You added an extra zero!"',
      'Agent demands you buy Target/Apple gift cards or deposit cash into a Bitcoin ATM to return the excess',
    ],
    actionDo: [
      'Check your actual bank statement on a separate device without the caller watching.',
      'Realize that refunds are processed back to the original payment method automatically; you never need to wire money back.',
    ],
    actionDont: [
      'NEVER buy gift cards, cryptocurrency, or withdraw physical cash for a customer service representative.',
      'Do NOT allow callers to inspect your online banking page.',
    ],
    realWorldExample: '"Geek Squad invoice #8912: Your annual anti-virus subscription of $499 has been charged. If you did not authorize this, call 1-888-XXX-XXXX immediately to cancel."',
    quickTakeaway: 'Fake invoice emails are lures to get you on the phone. Never buy gift cards to return a refund.',
    keywords: ['geek squad', 'norton', 'mcafee', 'refund', 'overpayment', 'gift card', 'bitcoin atm'],
  },

  // --- DELIVERY & COURIER SCAMS ---
  {
    id: 'delivery-customs-redelivery-fee',
    category: 'delivery',
    categoryLabel: 'Delivery & Couriers',
    title: 'Fake Courier "Unpaid $1.99 Fee" Address Traps',
    severity: 'critical',
    summary: 'Scammers blast millions of SMS texts claiming a package is on hold due to a missing street number or a small unpaid customs duty ($1.50 - $3.00), stealing your credit card details.',
    redFlags: [
      'SMS claims USPS, FedEx, DHL, Royal Mail, or Canada Post has a package waiting for you',
      'Link points to an unofficial domain like "usps-post-redelivery.top" or "fedex-track-parcel.xyz"',
      'Website asks for your full name, address, credit card number, CVV, and date of birth',
    ],
    actionDo: [
      'Copy the tracking number directly into the official usps.com or fedex.com website—never click the SMS link.',
      'Notice that USPS will never send text messages if you didn\'t register for text tracking on a specific parcel.',
    ],
    actionDont: [
      'Do NOT submit payment for unexpected delivery fees from unsolicited SMS alerts.',
      'Do NOT enter your credit card on non-official postal domains.',
    ],
    realWorldExample: '"USPS Notification: Your package has arrived at the local warehouse but cannot be delivered due to incomplete street address. Update details at http://usps-address-portal.top/redeliver"',
    quickTakeaway: 'National postal services do not text you asking for card payments to deliver regular mail. Always check official apps.',
    keywords: ['usps', 'fedex', 'dhl', 'package', 'customs fee', 'redelivery', 'tracking'],
  },

  // --- IMPERSONATION & GOVERNMENT SCAMS ---
  {
    id: 'impersonation-tax-irs-revenue',
    category: 'impersonation',
    categoryLabel: 'Govt & Impersonation',
    title: 'Tax Authority / IRS / CRA Impersonation Scams',
    severity: 'critical',
    summary: 'Aggressive callers claim you owe back-taxes and that local police or sheriffs are on their way to arrest you unless paid within 30 minutes via prepaid vouchers.',
    redFlags: [
      'Threat of immediate arrest, deportation, or driver\'s license revocation',
      'Demand for payment via Western Union, prepaid debit cards (Vanilla, GreenDot), or gift cards',
      'Caller refuses to allow you to consult an accountant or attorney first',
    ],
    actionDo: [
      'Remember that government tax agencies (IRS, HMRC, CRA, Income Tax Dept) first contact taxpayers by regular postal mail, NEVER by sudden threatening phone calls.',
      'Tax agencies will never ask for payment using gift cards or cryptocurrency.',
    ],
    actionDont: [
      'Do NOT panic. The IRS and police cannot arrest you over an unexpected phone call.',
      'Do NOT read out prepaid card numbers.',
    ],
    realWorldExample: '"This is Officer John Davis from IRS Criminal Investigation. There is a warrant against your SSN for unpaid taxes of $2,450. Pay via federal electronic voucher now or police will arrive at your home."',
    quickTakeaway: 'The IRS and tax agencies always communicate via official postal letters first, never sudden phone threats.',
    keywords: ['irs', 'tax', 'warrant', 'sheriff', 'prepaid card', 'back taxes', 'cra', 'hmrc'],
  },
  {
    id: 'impersonation-job-offer-rating',
    category: 'impersonation',
    categoryLabel: 'Govt & Impersonation',
    title: 'WhatsApp "Work From Home / YouTube Video Liking" Scams',
    severity: 'high',
    summary: 'Scammers offer simple tasks like "Like 3 YouTube videos or rate hotels on Google Maps for $50/hour". They pay you small amounts at first ($10) to build trust, then trick you into "VIP investment tasks" where you lose thousands.',
    redFlags: [
      'Unsolicited WhatsApp or Telegram message from a recruiter claiming to represent Amazon, TikTok, or a global HR firm',
      'Payment promised for trivial tasks: clicking subscribe, rating apps, reviewing hotel listings',
      'Requirement to deposit your own money as "security deposit" or "crypto fuel" to unlock earned profits',
    ],
    actionDo: [
      'Recognize that legitimate global companies do not recruit via cold WhatsApp messages from random international country codes.',
      'Block and report the sender immediately on WhatsApp.',
    ],
    actionDont: [
      'Do NOT deposit your own money into any platform to "unlock" previous task earnings—it is a sunken-cost trap.',
      'Do NOT share your bank account or personal ID documents with unverified WhatsApp recruiters.',
    ],
    realWorldExample: '"Hello! I am Emily from Kelly Services. We have part-time remote jobs. Just like 3 YouTube videos per day and earn $150–$300 daily. Paid directly via USDT or Bank. Are you interested?"',
    quickTakeaway: 'No company pays $100s for liking YouTube clips. Once you deposit your own money to unlock "VIP tasks", you never get it back.',
    keywords: ['job', 'recruiter', 'youtube likes', 'rating', 'work from home', 'telegram task', 'usdt'],
  },

  // --- GENERAL HYGIENE & PRO TIPS ---
  {
    id: 'pro-2fa-authenticator-app',
    category: 'banking',
    categoryLabel: 'General Defense',
    title: 'Switch from SMS 2FA to Authenticator Apps or Security Keys',
    severity: 'pro-tip',
    summary: 'SMS-based two-factor authentication is vulnerable to SIM-swapping, SS7 telecom interception, and smishing attacks. Authenticator apps (TOTP) or hardware keys are exponentially safer.',
    redFlags: [
      'Relying solely on SMS codes for high-value email, banking, and crypto exchange accounts',
    ],
    actionDo: [
      'Enable an Authenticator app (such as Google Authenticator, Microsoft Authenticator, or 2FAS) or use Passkeys / FIDO2 keys for your primary email and finance accounts.',
      'Set a SIM card PIN with your telecom carrier to prevent unauthorized SIM swaps if your phone is stolen.',
    ],
    actionDont: [
      'Do NOT reuse the same password across multiple websites. Use a reputable password manager.',
    ],
    realWorldExample: 'A cybercriminal uses social engineering on your cellular carrier to transfer your phone number to their SIM card, capturing your SMS 2FA codes.',
    quickTakeaway: 'App-based 2FA (TOTP) cannot be intercepted over cellular networks or diverted through SIM swaps.',
    keywords: ['2fa', 'authenticator', 'totp', 'sim swap', 'passkey', 'security key', 'yubikey'],
  },
  {
    id: 'pro-truecaller-shield-clipboard',
    category: 'sms',
    categoryLabel: 'General Defense',
    title: 'Using Auto-Clipboard Scanning to Vet Links Safely',
    severity: 'pro-tip',
    summary: 'Instead of directly tapping links in SMS or messaging apps, long-press to copy the link and let Truecaller Shield analyze it safely in an isolated heuristic engine.',
    redFlags: [
      'Clicking links blindly inside mobile chat apps without inspecting the destination URL',
    ],
    actionDo: [
      'Long-press any suspicious link in WhatsApp, SMS, or Telegram and tap "Copy Link".',
      'Open Truecaller Shield—the clipboard scanner will automatically pop up with risk indicators, typosquatting checks, and threat intel.',
    ],
    actionDont: [
      'Do NOT tap the link first "just to see where it goes". Many malicious pages immediately drop session grabbers or malware.',
    ],
    realWorldExample: 'A friend sends you a link in Messenger saying "Is this you in this video?". Instead of clicking, copy the link and analyze it in Truecaller Shield.',
    quickTakeaway: 'Copy and inspect first. Tapping links "just to see" exposes your browser to zero-day browser exploits.',
    keywords: ['clipboard', 'copy link', 'long press', 'auto scan', 'safe preview'],
  },
]

const LEARNED_STORAGE_KEY = 'truecaller_shield_learned_tips_v1'

export function getLearnedTipIds(): string[] {
  try {
    const raw = localStorage.getItem(LEARNED_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleLearnedTip(id: string): string[] {
  try {
    const current = getLearnedTipIds()
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export function getTipOfTheDay(): SecurityTip {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  const index = Math.abs(dayOfYear) % SECURITY_TIPS.length
  return SECURITY_TIPS[index]
}
