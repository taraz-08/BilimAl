# Design System Strategy: The Academic Atelier

## 1. Overview & Creative North Star
The North Star for this design system is **"The Academic Atelier."** 

Education platforms often fall into the trap of looking like cluttered dashboards or "playful" toy-like interfaces. This system rejects both. It draws inspiration from high-end editorial journals and prestigious architectural spaces. We are building a digital environment that feels like a quiet, sun-drenched library—vast, airy, and focused. 

To achieve this "high-prestige" feel, we break the "template" look through **intentional asymmetry** and **tonal layering**. We treat white space not as "empty" space, but as a structural element. By using extreme shifts in typography scale and replacing rigid borders with subtle shifts in surface luminance, we create an interface that feels curated rather than manufactured.

---

## 2. Colors: The Palette of Precision
Our color strategy relies on a monochromatic foundation with a singular, surgical strike of color.

*   **Primary & Background (#FFFFFF):** The canvas is pure. It creates a sense of infinite space.
*   **The Accent (#b7131a):** This red is our "scholarly seal." It is used sparingly for high-impact actions and critical emphasis, ensuring it never overwhelms the "airy" feel.
*   **The "No-Line" Rule:** We explicitly prohibit 1px solid borders for sectioning. Structural boundaries must be defined solely through background shifts. For instance, a `surface-container-low` (#f3f4f5) sidebar sitting against a `surface` (#f8f9fa) main stage. 
*   **Surface Hierarchy & Nesting:** Use the surface-container tiers to create "nested" depth.
    *   **Lowest (#ffffff):** Reserved for the most important interactive cards.
    *   **Low/Base (#f8f9fa):** The primary background level.
    *   **Highest (#e1e3e4):** Used for utility bars or secondary information modules.
*   **The "Glass & Gradient" Rule:** For floating modals or navigation overlays, use Glassmorphism. Apply `surface-container-lowest` at 80% opacity with a `backdrop-filter: blur(20px)`.
*   **Signature Textures:** For primary CTAs, do not use flat red. Use a subtle linear gradient from `primary` (#b7131a) to `primary_container` (#db322f) to provide a "lit from within" depth.

---

## 3. Typography: Editorial Authority
We utilize **Inter** not as a standard UI font, but as a modernist typeface.

*   **Display Scale (3.5rem - 2.25rem):** Use `display-lg` for hero moments. These should have tight letter-spacing (-0.02em) to feel like a high-end magazine headline.
*   **The Power of Asymmetry:** Pair a `display-sm` headline with a wide `body-lg` paragraph, but offset them. Use the `spacing-16` (5.5rem) token to create dramatic gaps that force the eye to focus on content.
*   **Labeling (0.75rem - 0.6875rem):** Use `label-md` in All Caps with increased letter-spacing (+0.05em) for secondary metadata. This mimics the "fine print" of a prestige certificate.
*   **Contrast:** High-contrast pairing between `on_surface` (#191c1d) for text and the white background ensures a crisp, academic readability.

---

## 4. Elevation & Depth: Tonal Layering
We move away from the "drop shadow" era into an era of **Ambient Light**.

*   **The Layering Principle:** Instead of shadows, stack surface tiers. Place a `surface_container_lowest` card on top of a `surface_container_low` background. The subtle 2% shift in color creates a "soft lift" that feels architectural.
*   **Ambient Shadows:** When a shadow is required for a floating state, use a diffuse, low-opacity tint.
    *   *Shadow Spec:* `0 12px 40px rgba(25, 28, 29, 0.06)`. This uses the `on_surface` color for the shadow rather than pure black, ensuring the shadow feels like a natural light obstruction.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., in a complex data table), use the `outline_variant` token at **15% opacity**. This "Ghost Border" provides a hint of structure without interrupting the visual flow.
*   **Glassmorphism:** Navigation rails should use a blurred surface to allow the content colors to bleed through subtly, maintaining a "light and airy" feel even when the UI is dense.

---

## 5. Components: The Building Blocks

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Radius: `xl` (1.5rem). No shadow, just a subtle inner glow.
*   **Secondary:** `surface_container_high` background with `primary` text. This avoids the "heavy" look of two solid buttons.
*   **States:** On hover, the primary button should slightly expand (scale 1.02) rather than just changing color.

### Cards & Lists
*   **The "No Divider" Rule:** Forbid 1px dividers. Use `spacing-4` (1.4rem) or `spacing-6` (2rem) of white space to separate list items.
*   **Layout:** Cards use `roundedness-xl` (1.5rem) for a friendly yet sophisticated feel. The background is always `surface_container_lowest` (#ffffff).

### Input Fields
*   **Style:** Minimalist. No bottom line. Instead, use a `surface_container_low` background with a `roundedness-md` corner.
*   **Focus:** On focus, the background shifts to pure white and a `primary` (red) Ghost Border (20% opacity) appears.

### Signature Component: The "Scholar's Progress"
*   A bespoke progress tracker that uses a thin `outline_variant` track with a `primary` (red) glow effect. It should feel like a fine needle on a high-end instrument.

---

## 6. Do’s and Don’ts

### Do
*   **Do** embrace extreme white space. If you think there’s enough, add 20% more.
*   **Do** use asymmetrical layouts (e.g., a 2-column grid where the left column is 30% and the right is 70%).
*   **Do** use `on_surface_variant` (#5b403d) for secondary text to keep the hierarchy soft.

### Don’t
*   **Don’t** use 1px solid black or grey borders. This instantly destroys the "prestige" feel.
*   **Don’t** use standard "Material Design" blue for links. Use the `primary` (red) or an underlined `on_surface` text style.
*   **Don’t** crowd the corners. Elements should "breathe" away from the edges of their containers using at least `spacing-4`.