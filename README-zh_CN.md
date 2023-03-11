# 真正的以包为主的 monorepo 结构

## 目录结构

```txt
├── apps
│   ├── cli
│   │   ├── package.json
│   │   └── pnpm-lock.yaml
│   └── web
│       ├── package.json
│       └── pnpm-lock.yaml
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

## 概念

- end project: 开发依赖链的终点，直接面向用户，在 rust 中是指会被整个编译成二进制文件的包，在 javascript 中是会被 bundle all 的包，诸如 cli，website 等

- package-based: 每个包都是一个独立的个体，彼此之间开发不受影响，每个包可以独立开发、构建

- lockfile: 语义化版本的锁文件，如 `package-lock.json yarn.lock pnpm-lock.yaml`

## 该结构是什么？

由 [Cargo](https://rustwiki.org/en/cargo/faq.html#why-do-binaries-have-cargolock-in-version-control-but-not-libraries) 启发而来

1. 以每个包为中心，安装依赖(install)、构建(build)(会同时构建其子依赖)、运行(run)，而发布(publish)，则是以整个 git repo 为单位进行。

2. 将 pnpm 原来直接 link workspace 的行为，修改为只 link `package.json` 中声明发布的内容，并根据 lock 安装指定依赖

如: `component -> util`

util: 使用 util 的 `devDependencies-lock.yaml` 在 util 目录 install，之后 `npm run build`

component: 使用 component 的 `devDependencies-lock.yaml` 在 component 目录 install，之后 `npm run build`

3. 独立的 lockfile，每个子应用记录自己的 `devDependencies-lock.yaml`，在构建之前以自己为中心 `install`，仅自己的 lock 会起作用

4. devDependencies-lockfile，不会锁定运行时相关 dependencies，只锁构建相关的依赖 比如 devDependencies 中的 webpack、vite，和工具链相关的依赖，比如 node、npm、eslint、prettier、lint-staged 等，而 end-project 理应将所有依赖都算为 "devDependencies"

5. 和 Cargo 类似的 `install+build` 任务编排

一个具体的实例

我们假设依赖图为 `app > component > util`

若我们想构建一个完整的 app 到生产环境 ，`build app` 这一任务实际需要完成的事如下

通常的执行顺序为：

```txt
install:(app,component,util) -> build:util -> build:component -> build:app 
```

> 注: install:(a,b,c) 是指使用 a 的 `devDependencies-lock.yaml` 在 a 目录下 install, 但由于 b,c 为 a 的依赖，所以 b 和 c 也会被创建 node_modules

但理论上的安全且稳定的执行顺序应为：

- 若 util 和 component 需要构建

```txt
     util      ->         component                 ->            app
install:(util)         install:(component, util)            install:(app, util, component) 
  build:util             build:component                      build:app  
```

- 若 util 和 component 为 typescript源码开发，无需构建

```txt
     util      ->        component         ->          app
     none                   none                  install:app
                                                    build:app
```



## 解决了什么问题?

1. 集中式 lockfile 冲突难解决

例如：workspace-a 和 workspace-b 共同依赖了 `react@18.2.0` , `react@18.2.0` 依赖了 `loose-envify@1.2.0`

若 workspace-a 将间接依赖升级为了 `loose-envify@1.3.0`, workspace-b 同时也会收到影响

2. `dependencies` 和 `devDependencies` 界限模糊

使用 pnpm-monorepo 开发环境中 `dependencies` 和 `devDependencies` 依赖均存在，区别对待了本地的包和第三方包。

3. 发包项目，只锁`devDependencies`，`dependencies`跟随语义化版本，和使用者开发环境一致

4. 部分安装和部分构建 partial install 和 partial build

之前：根目录整个 monorepo 全量 install

之后：每个项目单独 install，只会 install 到所需的依赖

5. package-based，隔绝各个子项目间的影响，仅以包管理形式沟通

例如：以下这两个包

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

`install:(util) > build:util >  install:(component, util) > build:component` 

**install:(util)**: 在 util 目录下 使用 util 的 `dev-dependencies-lock.yaml` `pnpm install`

**build:util**: 在 util 目录下 `npm run build`

**install:(component,util)**: 
在 component 目录下 使用 component 的 `dev-dependencies-lock.yaml` `pnpm install` 

会将 util 的产物 link 过来，并补全依赖 "lodash"

**build:component**:

在 component 目录下 `npm run build`


## 示例工程 —— 本仓库

本仓库是由 moonrepo 起的概念工程，仅实现了部分功能，但是你仍然能够感到丝滑流畅的 monorepo build 流程

### 快速开始 

```bash
> git clone git@github.com:SoonIter/the-real-monorepo-of-javascript.git

> npm run bootstrap  # 根目录
> npm run web:build or npm run cli:build
```

### 尚未实现

- 将`pnpm-lock.yaml`转换为`dev-dependencies.yaml`，并安装依赖 子 workspace 的直接依赖项
