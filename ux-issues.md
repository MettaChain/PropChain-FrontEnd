# UX Issues for PropChain FrontEnd

## #145 UX: Implement drag-and-drop for portfolio reordering

**Repository:** MettaChain/PropChain-FrontEnd

**Summary:**
Allow users to reorder their portfolio holdings by dragging and dropping property cards.

**Implementation Requirements:**
- Drag handle on portfolio cards
- Smooth drag animation
- Order persisted to localStorage
- Keyboard-accessible reordering
- Reset to default order option

---

## #144 UX: Add tooltips to explain Web3 terminology

**Repository:** MettaChain/PropChain-FrontEnd

**Summary:**
Terms like 'gas fee', 'token', 'smart contract', 'yield', and 'APY' may be unfamiliar to new users.

**Terms to Explain:**
- Gas fee
- Token / Tokenization
- Smart contract
- Yield / APY
- Liquidity
- Slippage
- Block confirmation

---

## #142 UX: Improve transaction status feedback with step-by-step progress

**Repository:** MettaChain/PropChain-FrontEnd

**Summary:**
After submitting a transaction, show a step-by-step progress indicator.

**Steps to Show:**
1. Signing transaction (wallet prompt)
2. Broadcasting to network
3. Waiting for confirmation (X/12 blocks)
4. Transaction confirmed

---

## #143 UX: Add copy-to-clipboard for wallet addresses and transaction hashes

**Repository:** MettaChain/PropChain-FrontEnd

**Summary:**
Add a copy button next to all wallet addresses and transaction hashes.

**Locations:**
- Wallet address in header
- Transaction hash in history
- Contract addresses in property details
- Referral link
- Share property URL
