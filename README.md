# Setting up babel-local-dev

## Step 1: check out all the things

Clone all the repositories in a working directory.
We're going to be running docker from this working directory,
so `babel-local-dev` has access to the other repositories.

First clone this repository:
```bash
git clone git@github.com:hathitrust/babel.git babel
```

Then run:

```bash
cd babel
./setup.sh
```

This will check out the other repositories along with their submodules.
There's a lot, because we're replicating running on the dev servers with
`debug_local=1` enabled.

## Step 3: build the `babel-local-dev` environment

In your workdir:

```
docker compose --profile frontend build
docker compose --profile backend build
```
## Step 4: Build assets

Build the CSS and JavaScript for `firebird-common` and `pt`:

```bash
#build firebird-common
docker compose run firebird /htapps/babel/firebird-common/bin/build.sh

# build pt/firebird
docker compose run page-turner /htapps/babel/pt/bin/build.sh
```

## Step 5: run `babel-local-dev`:
Within the Babel project, we have the option to stand up the frontend, backend, or everything.

- To stand up the frontend and core services for development, use the following command.

```bash
docker compose --profile frontend up
```

- To run the backend and core services for development, run the following command

```bash
docker compose --profile backend up
```

In your browser:

* catalog: `http://localhost:8080/Search/Home`
* catalog solr: `http://localhost:9033`
* full-text solr: `http://localhost:8983`

PageTurner & imgsrv:

* `http://localhost:8080/cgi/pt?id=test.pd_open`
* `http://localhost:8080/cgi/imgsrv/cover?id=test.pd_open`
* `http://localhost:8080/cgi/imgsrv/image?id=test.pd_open&seq=1`
* `http://localhost:8080/cgi/imgsrv/html?id=test.pd_open&seq=1`
* `http://localhost:8080/cgi/imgsrv/download/pdf?id=test.pd_open&seq=1&attachment=0`

mysql is exposed at 127.0.0.1:3307. The default username & password with write
access is `mdp-admin` / `mdp-admin` (needless to say, do not use this image in
production!)

```bash
mysql -h 127.0.0.1 -p 3307 -u mdp-admin -p
```
Huzzah!

## How this works (for now)

* catalog runs + php
* babel cgi apps run under apache in a single container
* imgsrv plack/psgi process runs in its own container
* apache proxies to imgsrv & catalog



## Running Tests

There are two sets of tests:

### Back-end tests using perl

```bash
docker compose run perl-test
```

### End-to-end tests using playwright

There is a helper script to set up the environment for unauthenticated and
authenticated tests with playwright.

To run all playwright tests:

```bash
bin/run_playwright_tests.sh all
```

If a particular suite fails, the tests will stop; you can examine the traces with

```bash
docker compose up -d playwright_reports
```

then going to <http://localhost:9323>.

You can run a particular set of tests with:


Tests with an unauthenticated user (most of them):
```bash
bin/run_playwright_tests.sh unauthed
```

Tests for print-disabled access:
```bash
bin/run_playwright_tests.sh ssd_user
```

Tests for resource sharing:
```bash
bin/run_playwright_tests.sh resource_sharing_user
```

## Staging an Item

### From production repository

The easiest way to do this (for internal developers) is to copy a ZIP and METS
from production:

First set the `HT_REPO_HOST` environment variable to somewhere you can scp from:

```bash
  export HT_REPO_HOST=somebody@whatever.hathitrust.org
```

Then:

```bash
./stage_item_scp.sh uc2.ark:/13960/t4mk66f1d
```

This will download the item via scp as well as its catalog metadata, stage it
to the local repository, and index it in the local full-text index. You should
then be able to view it via for example
http://localhost:8080/cgi/pt?id=uc2.ark:/13960/t4mk66f1d

### From datasets

With access to the `ht_text_pd` dataset (this should work from the Library VPN
but is also [available to other qualified
individuals](https://www.hathitrust.org/member-libraries/resources-for-librarians/data-resources/research-datasets/),
it is also possible to stage only the full-text for the item using the HTRC
datasets. This
is potentially faster, since you only need to transfesr the full-text rather
than the images. This allows full-text search and access via e.g.
`http://localhost/cgi/ssd?id=HTID`, but PageTurner won't work (because the zip
doesn't contain the images.)

```
bash ./stage_item_rsync.sh uc2.ark:/13960/t4mk66f1d
```

## Database Utilities

### Resetting / updating database & solr schema

`reset_database.sh`: If you need to reset or update the database or solr
schema, you will need to make sure the persistent volumes for them are removed
so that when you restart the containers they will get a fresh copy of the
schema. The `reset_database.sh` script will do this.

`mysql_sdr.sh`: This will connect to the `ht` database running inside the mysql
container.

## Authentication

You can simulate various authenticated scenarios by setting environment
variables in Apache. There is appropriate setup for a variety of scenarios and
user types in configuration files under `apache-cgi/auth`, and a helper script
`switch_auth.sh` to allow you to pick a particular scenario and configure the
local Apache server to use it.

There are several synthetic items in the sample data that can be tested with
authenticated access:

* `test.ic_currently_held`: in-copyright; holdings API indicates it is currently held
* `test.ic_not_current`: in-copyright; holdings API indicates it is withdrawn
* `test.ic_not_held`: in-copyright; holdings API indicates it is not held at all

By default, all access will be geolocated as from the US. See [info about the
test geoip databases](geoip/README.md) for more information about how for
testing non-US access.

## TODO

- [ ] link to documentation for important tasks - e.g. running apps under debugging, updating css/js, etc
- [ ] easy mechanism to generate placeholder volumes in `imgsrv-sample-data` that correspond to the records in the catalog
