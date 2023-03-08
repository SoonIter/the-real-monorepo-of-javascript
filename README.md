# pnpm-lock-end

This example shows what a real monorepo is

```txt
── apps
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
    │   └── package.json
    ├── sdk
    │   └── package.json
    └── util
        └── package.json
```

Do not link the workspace package. They should be treated as third-party packages.

only the end app/cli that bundles all the code to user need lock

## end application —— web or cli 

 end application, you should not install any dependencies, use them as devDependencies and bundle them all


## lib application —— 3rd package

do not use lockfile, be installed without difference from ordinary third-party packages


## infrastructure —— eslint jest lint-staged or something else

lock in a seperated package, do not install it into subworkspace