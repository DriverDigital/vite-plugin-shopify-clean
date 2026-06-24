# Contributing

Thanks for your interest in improving `@driver-digital/vite-plugin-shopify-clean`! This guide covers the basics for getting set up and submitting a change.

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0` (see `.nvmrc`)
- [pnpm](https://pnpm.io/)

## Install dependencies

```bash
pnpm install
```

## Build

```bash
pnpm build
```

Other useful scripts:

```bash
pnpm test    # run the test suite
pnpm lint    # lint and auto-fix
pnpm watch   # rebuild on change
```

## Open a pull request

1. Fork the repository and create a branch for your change.
2. Make your change, then run `pnpm build` and `pnpm test` to make sure everything passes.
3. Commit with a clear message and push your branch.
4. Open a pull request against `main`, describing what you changed and why. Link any related issue.

A maintainer will review your PR as soon as they can. Thanks for contributing!
