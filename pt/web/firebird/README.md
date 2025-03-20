# firebird-reader

To work on this in babel docker, you'll need to run

```sh
cd babel
docker compose --profile node up
```

This runs the firebird javascript and pt javascript in two different containers.

## run tests

Playwright tests are in the `/tests` directory. Running `npm test` at `/babel/pt/web/firebird` should run the tests (but if you get an error about a package not found, you probably need to install via `npm install`).

To run the tests in docker:

```
docker compose run playwright
```
