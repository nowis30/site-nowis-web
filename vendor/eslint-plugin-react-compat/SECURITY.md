# Local ESLint 10 compatibility adapter

Source: [eslint-plugin-react 7.37.5](https://github.com/jsx-eslint/eslint-plugin-react), MIT license retained. The npm distribution integrity is `sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==`. Its published runtime and configurations are retained without changing any rule implementations. Upstream entry: `index.js`.

The repository package is explicitly named `@nowis/eslint-plugin-react-compat`, version `7.37.5+nowis.1`. This is not an upstream release or an assertion of upstream support for ESLint 10. The added `compat.cjs` entry uses the official `@eslint/compat 2.1.1` adapter to restore the rule-context APIs removed by modern ESLint. Flat presets reuse the adapted plugin export to avoid conflicting plugin objects when presets are composed. Every rule, schema, preset severity, setting and option remains available. Only the local manifest, adapter and this document differ from the published runtime.

The root dependency is `file:vendor/eslint-plugin-react-compat`; the npm override references that root dependency. `npm ci` and the committed lock therefore resolve this adapter for Next's callers too. The local peer contract is ESLint `^10.0.0`; it is backed by runtime tests rather than editing peer metadata alone. Older ESLint releases are not claimed by this package.

`scripts/eslint-plugin-compat.test.cjs` checks every original rule name and meta/schema identity, all preset severities, actual invalid/corrected React/accessibility/import diagnostics on ESLint 10, and the flat-preset entry. The complete application lint must also pass with all rules active. This coverage does not prove every possible configuration; additions to the application must retain normal lint validation.

At each dependency update, check the official registry/repository for native ESLint 10 support. Prefer an upstream supported release once the same runtime and full-application checks pass. If retaining the adapter, refresh the exact published runtime and license, record its version/integrity, review changes to rule APIs/presets, and rerun the compatibility tests, fresh npm ci, complete npm audit, lint, type checks and build. Never remove rules, widen peer metadata without a runtime adaptation, suppress install warnings, or ignore audit entries to obtain a clean report.

Official adapter documentation: https://eslint.org/blog/2024/05/eslint-compatibility-utilities/

