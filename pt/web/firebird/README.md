# firebird-reader

To work on this in babel docker, you'll need to run

```sh
cd babel
docker compose --profile node up
```

This runs the firebird javascript and pt javascript in two different containers.

## Storybook

Run locally with `npm run storybook` (port 6007), or in Docker with `docker compose --profile storybook up` from `babel/`. The firebird-common storybook uses port 6006, so both can run at the same time.

## run tests

Playwright tests are in the `/tests` directory. Running `npm test` at `/babel/pt/web/firebird` should run the tests (but if you get an error about a package not found, you probably need to install via `npm install`).

To run the tests in docker:

```
docker compose run playwright
```
