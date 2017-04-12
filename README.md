# Dockas REST API

This repo implements a rest api for the Dockas project.

## Quick Install

You should clone this repository with `--recursive` option or run `make init` after cloning to initialize all the submodules.

## Colaborating

This monolitic rest api is designed with one goal in mind: to be very easy to update it to a scalable micro-service design using thrift as communication protocol. All services is located in `lib/core` (i.e., the core logic) folder and the interfaces to this services are located in `lib/services`. This interfaces are used by all route controllers located in `lib/app` to communicate with the services. 

All services functionality are splited in it's own folders. For example, service product is basically a CRUD service, so it exposes a `create` functionality which is handled in `lib/core/product/create` module. All this functionality handlers are grouped and exposed together in `lib/core/product/index.js`. This design is great once it allows each functionality to grow in it's own folder leading to smaller files. For example, the `create` functionality uses `lib/core/product/create/model.js` to control data schema that can be inserted into the database. This is also the case with `lib/core/product/find/model.js`, which controls the find query that can be used to find specific products.