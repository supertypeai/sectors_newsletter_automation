# Organization UTM Standard & Naming Convention

This schema defines the **mandatory standard** for all tracked links across the organization. Following this strictly ensures clean data reconciliation, accurate customer-journey timelines, and seamless tracking across channels.

---

## 1. Parameter Definitions & Schema

| Parameter      | Type / Format           | Requirement  | Rule & Description                                                                            | Allowed Enumerations                                                                         |
| :------------- | :---------------------- | :----------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| `utm_source`   | **Enum** (Fixed String) | **Required** | **Where the traffic originates.** Identifies the specific publisher, platform, or property.   | `newsletter`, `sectorsapp`, `voronoi`, `linkedin`, `instagram`, `threads`, `youtube`, `tiktok`, `twitter`, `facebook`, `qr`, `whatsapp`, `google`|
| `utm_medium`   | **Enum** (Fixed String) | **Required** | **How the message is delivered.** High-level marketing/channel category.                      | `email`, `bulletin`, `social`, `offline`, `referral`, `ads`                                      |
| `utm_campaign` | `{slug}_{YYYY-MM-DD}`   | **Required** | **Which specific content/effort pushed it.** Identifies the core story or campaign.           | `{content-slug}_{YYYY-MM-DD}`                                    |
| `utm_content`  | `kebab-case`            | Optional     | **Which specific element inside the piece was clicked** (e.g., `headline`, `cta`, `slide-3`). | `kebab-case` values such as `headline`, `cta`, `slide-3`                                     |
| `utm_term`     | `lowercase-ticker`      | Optional     | **Which ticker or stock is being featured.** Omit if not stock-specific.                      | `lowercase-ticker` or omit                                                                   |
| `utm_author`   | `kebab-case`            | Optional     | **Which staff member authored the content.** Omit if not applicable.                          | `kebab-case` values such as `evelyn`, `aidityas`, `teamalgoritma`                            |

- `content_slug` could mean the name of the workshop or event, i.e. `odoo-meetup`, or the `agentic-finance-2025` conference

---

## 2. Strict Standardization Rules

- **Formatting & Casing:** **EVERYTHING MUST BE LOWERCASE.** No uppercase, no camelCase, no title Case.
- **Separators:**
  - Use **hyphens (`-`)** inside slugs and content identifiers (e.g., `weekly-insights`).
  - Use **underscores (`_`)** ONLY to separate the slug from the date in `utm_campaign` (e.g., `slug_2026-07-20`).
- **Source vs. Medium Placement Rules:**
  - Use `utm_medium`=`ads` for all paid campaigns, including Google Ads, Meta Ads, and LinkedIn Ads. `meta_ads` should not be used as a source, use `facebook` or `instagram` as the source instead.
  - `utm_source=voronoi` defaults to `utm_medium=social`. Use another medium only when the placement itself is paid (`ads`) or the link sits on a third party's property (`referral`).
  - No Abbreviations. Always spell out platform names in full for utm_source (e.g., use `instagram` not ig, `facebook` not fb, `youtube` not yt
  - **Paid Ads Placement:** 
    - Use `utm_medium=ads` for all paid campaigns. 
    - Use the native platform for `utm_source` (e.g., `facebook`, `instagram`, `linkedin`, `google`). Never use `meta_ads` or `google_ads` as a source.
  - **Distinguishing `utm_medium` (Social vs. Referral vs. Influencer)**
    - Use the ownership of the account posting the link to determine the correct `utm_medium`:

    | Link Publisher / Owner | `utm_source` | `utm_medium` | Notes & Best Practices |
    | :--- | :--- | :--- | :--- |
    | **Official Brand Account** | Platform name (e.g., `instagram`, `linkedin`) | `social` | Any organic post, bio link, story, or video posted by our official channels. |
    | **Brand Employee / Staff** | Platform name (e.g., `instagram`, `linkedin`) | `social` | Standard social share by internal team members. Include `utm_author={staff-slug}`. |
    | **Direct / Broadcast Messaging** | Platform name (e.g., `whatsapp`) | `social` | Direct messaging, broadcast lists, or community chats. |
    | **External User / Partner** | Website or Platform | `referral` | Organic links shared by non-employees or placed on third-party sites/blogs. |

- **Owner Rule:** 
  - Use `utm_author` to mark authorship of the content.

---

## 3. Campaign Structure (`utm_campaign`)

Format: `{content-slug}_{YYYY-MM-DD}`

- **Rule:** If the same content is published across multiple channels on the same day, **use the identical `utm_campaign` value across all channels**.
- **Reasoning:** `utm_source` is what distinguishes the channel. Keeping `utm_campaign` identical allows automated scripts to aggregate and compare cross-channel performance instantly.

### Valid Examples:

- `weekly-insights-v2_2026-07-20`
- `monthly-market-pulse_2026-07-20`
- `bbca-earnings-story_2026-07-20`

---

## 5. Standardized Examples

#### 1. Newsletter CTA Button

?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-insights-v2_2026-07-20&utm_content=cta

#### 2. Instagram Carousel Last Slide

?utm_source=instagram&utm_medium=social&utm_campaign=weekly-insights-v2_2026-07-20&utm_content=slide-8-cta

#### 3. Ticker-Specific Link in Newsletter Table

?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-insights-v2_2026-07-20&utm_content=top-movers&utm_term=bbca

#### 4. Algoritma Newsletter Cross-Post

?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-insights-v2_2026-07-20&utm_content=cta&utm_author=teamalgoritma

#### 5. Staff Personal LinkedIn Share

?utm_source=linkedin&utm_medium=social&utm_campaign=bbca-earnings-story_2026-07-20&utm_content=post&utm_author=evelyn

#### 6. Staff WhatsApp Broadcast

?utm_source=whatsapp&utm_medium=social&utm_campaign=weekly-insights-v2_2026-07-20&utm_author=evelyn

#### 7. Workshop QR Code / Handout

?utm_source=qr&utm_medium=offline&utm_campaign=investing-101-workshop_2026-07-20&utm_content=qr-slide

#### 8. Official Instagram Bio Link (Social)
?utm_source=instagram&utm_medium=social&utm_campaign=summer-launch_2026-07-20&utm_content=bio-link

#### 9. Influencer Post on Instagram (Referral / Influencer)
?utm_source=instagram&utm_medium=referral&utm_campaign=summer-launch_2026-07-20

#### 10. Meta Paid Ad (Instagram Feed)
?utm_source=instagram&utm_medium=ads&utm_campaign=summer-launch_2026-07-20

---
