# Scripts Directory

This directory contains utility and automation scripts for the project.

## Scripts

### `deploy-demo.sh`

**Note:** This is an interim solution.

Due to GitHub Free tier restrictions on private repositories, certain GitHub Actions like deploying to GitHub Pages might not be fully supported natively. This script manually performs the same actions as `.github/workflows/deploy-demo.yml`.

It will:
1. Ensure dependencies are installed via `pnpm install`.
2. Build the demo using `pnpm run build:demo`.
3. Create an orphaned branch named `demo` from the output directory `examples/vite-static/dist`.
4. Force-push the `demo` branch to the `origin` remote.

#### Usage

To deploy the demo, simply run the script from the repository root:

```bash
./scripts/deploy-demo.sh
```

Ensure that you have push access to the repository on GitHub, as the script pushes directly to the `demo` branch.
