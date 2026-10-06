# Local security fork of braces

This is an MIT-licensed fork of `braces@3.0.3`, named `@nowis/braces-safe@3.0.3-nowis.1`. Upstream copyright and LICENSE are retained. It is not an upstream release.

Upstream source: https://github.com/micromatch/braces/tree/3.0.3
Tag commit: `74b2db2938fad48a2ea54a9c8bf27a37a62c350d`.
Original npm tarball integrity: `sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==`.
Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

The published 3.0.3 recursive AST walkers accept deeply nested patterns below their character limit. This fork changes the actual parser, walkers, array flattening and expansion code. It enforces fixed, caller-independent limits: 10,000 input characters, 64 AST/array levels, 20,000 AST/array visits, 10,000 expanded results and 1 MiB output text. Unsafe input fails with an explicit `RangeError` carrying `BRACES_COMPLEXITY_LIMIT`. Caller options cannot raise or disable these ceilings; `maxLength: NaN` also cannot disable the original character limit.

The parser rejects nesting before pushing deeper nodes. All exported and directly importable compile/expand/stringify walkers validate supplied ASTs iteratively, including node count, depth, cycles and parent chains. Flattening is iterative and cycle-aware. Expansion checks range size and Cartesian product before allocating the large result. Compiling ordinary step-one numeric ranges still uses the compressed upstream expression.

`scripts/braces-security.test.cjs` retains six original upstream fixture files under `test/upstream`, adds normal compatibility fixtures and tests deep balanced/unbalanced braces, parentheses, all public APIs, direct internal APIs, forged/cyclic ASTs, cyclic arrays, huge ranges, Cartesian products and options intended to disable limits. It also verifies the installed consumers resolve this fork.

The root dev dependency and the `$braces` override must remain paired. `package-lock.json` resolves the fork to this tracked directory and locks its `fill-range` dependency. `npm ci` and full `npm audit` must be rerun after dependency changes. Registry audit does not review unpublished local fork code, so zero advisories alone is insufficient: retain the adversarial tests, source review and actual Tailwind/ESLint/build validation. No audit exclusion is required.

Recheck upstream releases and the advisory on every security/dependency update. When an official corrected release exists, compare its fixes and API behavior, replace this override, regenerate the lock and run the same fixtures and application checks before deleting the fork. Any new dependency path that bypasses the override must fail the consumer-resolution check and be corrected. Do not rename or change the version to claim a fix without the corresponding code patch and tests.
