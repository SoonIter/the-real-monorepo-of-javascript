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

- end project: The end of the development dependency chain is directly user-oriented. In rust, it refers to the package that will be compiled into a binary file, and in javascript, it is a package that will be bundled all, such as cli, websi Te, etc.

- package-based: Each package is an independent individual, and the development between them is not affected. Each package can be developed and built independently.

- lockfile: semantic version of the lock file, such as `package-lock.json yarn.lock pnpm-lock.yaml`

## What is the structure?

Inspired By [Cargo](https://rustwiki.org/en/cargo/faq.html#why-do-binaries-have-cargolock-in-version-control-but-not-libraries)

1. With each package as the center, install, build (it will build its sub-dependencies at the same time), run, and publish is carried out on the entire git repo.

2. Modify the behavior of pnpm's original direct link workspace to only the published content declared in the `package.json`, and specify the dependency according to the lock installation.

For example: `component -> util`

util: Use util's `devDependencies-lock.yaml` to install in the util directory, and then `npm run build`

component: use component `devDependencies-lock.yaml` to install in the component directory, and then `npm run build`

3. Independent lockfile, each sub-application records its own `devDependencies-lock.yaml`, centered on itself `install` before construction, only its own lock will work.

4. devDependencies-lockfile will not lock runtime-related dependencies, only lock the build-related dependencies such as webpack, vite, and tool chain in devDependencies. Related dependencies, such as node, npm, eslint, prettier, lint-staged, etc., and end-project should count all dependencies as "devDependencies"

5. `install+build` task arrangement similar to Cargo

a specific example

Let's assume that the dependency graph is `app > component > util`

If we want to build a complete app to the production environment, the task of `build app` actually needs to be completed as follows.

The usual execution order is:

```txt

Install:root -> build:util -> build:component -> build:app

```

> Note: install:(a,b,c) refers to the use of `devDependencies-lock.yaml` of a to install in the a directory, but because b,c is the dependency of a, so b and c It will also be created node_modules

However, the theoretical safe and stable execution order should be:

- If util and component need to be built

```txt
     util      ->         component                 ->            app
install:(util)         install:(component, util)            install:(app, util, component) 
  build:util             build:component                      build:app  
```

- If util and component are developed for typescript source code, there is no need to build

```txt
     util      ->        component         ->          app
     none                   none                  install:app
                                                    build:app
```

## What problem has been solved?

1. Centralized lockfile conflict is difficult to solve

For example: workspace-a and workspace-b rely on `react@18.2.0` together, and `react@18.2.0` rely on `loose-envify@1.2.0`

If workspace-a upgrades indirect dependency to `loose-envify@1.3.0`, workspace-b will also be affected.

2. The boundary between `dependencies` and `devDependencies` is blurred

Both `dependencies` and `devDependencies` dependencies exist in the pnpm-monorepo development environment, which treats local packages differently from third-party packages.

3. For the contracting project, only lock `devDependencies`, `dependencies` follow the semantic version, which is consistent with the user development environment.

4. Partial install and partial build

Previous: root directory whole monorepo full install

After that: Each project is installed separately, and only the required dependencies will be installed.

5. Package-based, isolate the influence between each sub-project, and only communicate in the form of package management.

For example: the following two packages 

```json
// 
{
     "name": "component",
     "dependencies": {
          "util": "workspace:*"
     },
     "scripts": {
          "build": "output xxx ./dist"
     }
}
```
```json
{
     "name": "util",
     "files": [
          "dist",
          "package.json"
     ],
     "dependencies": {
          "lodash": "^1.0.0"
     },
     "scripts": {
          "build": "output xxx ./dist"
     }
}
```

`install:(util) > build:util > install:(component, util) > build:component`

**Install:(util)**: Use util `dev-dependencies-lock.yaml` `pnpm install` in the util directory

**Build:util**: `npm run build` in the util directory

**Install:(component,util)**:

Use component `dev-dependencies-lock.yaml` `pnpm install` in the component directory

The product of util will be linked and the dependency on "lodash" will be completed.

**Build:component**:

In the component directory `npm run build`


## Sample Project - This git-repo

This warehouse is a conceptual project started by moonrepo, which only implements some functions, but you can still feel the smooth monorepo build process.

### quick start

```bash
> git clone git@github.com:SoonIter/the-real-monorepo-of-javascript.git

> npm run bootstrap  # 根目录
> npm run web:build or npm run cli:build
```

- transform `pnpm-lock.yaml` to `dev-dependencies.yaml` and install the dependencies of dependent sub workspace 
