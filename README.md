# Real package-based monorepo structure

## Directory structure

```txt
├── apps
│   ├── cli
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   └── pnpm-workspace.yaml
│   └── web
│       ├── package.json
│       ├── pnpm-lock.yaml
│       └── pnpm-workspace.yaml
├── package.json
└── packages
    ├── component
    │   ├── devDependencies-lock.yaml
    │   └── package.json
    ├── sdk
    │   ├── devDependencies-lock.yaml
    │   └── package.json
    └── util
        ├── devDependencies-lock.yaml
        └── package.json
```

## Concept

- end-project: The end of the development dependency chain is directly user-oriented. In rust, it refers to the package that will be compiled into a binary file, and in javascript, it is a package that will be bundled all, such as cli, website, etc.

- package-based: Each package is an independent individual, and the development between them is not affected. Each package can be developed and built independently.

## What is the structure?

inspired by [Cargo](https://rustwiki.org/en/cargo/faq.html#why-do-binaries-have-cargolock-in-version-control-but-not-libraries) 

1. literally package-based, with each package as the center to install, build (which will build its sub-dependencies at the same time), run(run script)

2. Split-lockfile, each sub-application records its own `devDependencies-lock.yaml`. Before building, take itself as the center to `install`, and only your own lock will work.

3. devDependencies-lockfile will not lock runtime-related dependencies, but only build related dependencies such as webpack, vite, and tool chains in devDependencies. Related dependencies, such as node, npm, eslint, prettier, lint-staged, etc., and end-project should count all dependencies as "devDependencies"

4. `install+build` task arrangement similar to Cargo, a specific example

Let's assume that the dependency graph is `app > component > util`

If we want to build a complete app to the production environment, the task of `build app` actually needs to be completed as follows.

The usual execution order is:

> Note: install:(a,b,c) refers to install with a as the center, but because b, c is the dependency of a, b and c will also be created node_modules

```txt

Install:(app,component,util) -> build:util -> build:component -> build:app

```

However, the theoretical safe and stable execution order should be:

- If util and component need to be built

```txt

Util -> component -> app

Install:(util) install:(component, util) install:(app, util, component)

Build:util build:component build:app

```

- If util and component are developed for typescript source code, there is no need to build

```txt

Util -> component -> app

None none install:app

Build:app

```

## What problem has been solved?

1. Centralized lockfile conflict is difficult to solve

For example, upgrading the dependency version in workspace-a will affect the dependency link of workspace-b.

2. The boundaries between `dependencies` and `devDependencies` are blurred, using 'dependencies` and `devDependencies` in the pnpm-monorepo development environment Dependencies exist, treating local packages from third-party packages differently.

3. For the contracting project, only lock `devDependencies`, `dependencies` follow the semantic version, which is consistent with the user development environment.

4. Partial install and partial build

5. Package-based, isolate the impact between sub-projects