/**
 * Stylelint — enforces the CSS architecture mechanically, so the rules don't
 * depend on anyone (human or model) remembering them.
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Force design tokens: no raw hex colors in component/page CSS — use var(--…).
    'color-no-hex': true,
    // Force px in source; postcss-pxtorem converts to rem. Never hand-write rem.
    'unit-disallowed-list': ['rem'],
    // No deep descendant nesting in modules — only &-nesting + @media.
    'max-nesting-depth': [1, {ignoreAtRules: ['media', 'supports', 'layer']}],
    // CSS Modules use camelCase / kebab classes freely; don't fight them.
    'selector-class-pattern': null,
    'custom-media-pattern': null,
    'custom-property-pattern': null,
    // postcss-custom-media / preset-env syntax stylelint can't natively parse —
    // don't flag @custom-media or `@media (--bp-…)` references as errors.
    'at-rule-no-unknown': [true, {ignoreAtRules: ['custom-media']}],
    'media-feature-name-no-unknown': null,
    // --- Cosmetics: this config enforces architecture, not formatting. ---
    // postcss-import resolves string notation; that's the convention here.
    'import-notation': 'string',
    // -webkit-text-size-adjust and -webkit-tap-highlight-color have no
    // standard equivalents browsers honour.
    // Must be a regex — a plain 'text-size-adjust' string does not match here.
    'property-no-vendor-prefix': [
      true,
      {ignoreProperties: ['/text-size-adjust/', '/tap-highlight-color/']},
    ],
    // Compact rule/token groups (h1–h6, token sections) are intentional.
    'rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
  },
  overrides: [
    {
      // These two define values rather than consume them: tokens.css holds the
      // palette, print.css re-grounds it for paper. Both need raw hex.
      files: ['**/styles/base/tokens.css', '**/styles/print.css'],
      rules: {
        'color-no-hex': null,
        'unit-disallowed-list': null,
      },
    },
  ],
}
