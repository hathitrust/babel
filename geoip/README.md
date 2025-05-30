# Fake GeoIP databases for testing

For testing end-to-end functionality in the babel apps that relies on a specific geolocation.

* `always_us.mmdb` - returns US for any IPv4 address
* `always_nonus.mmdb` - returns UK for any IPv4 address

Created using [mmdbctl](https://github.com/ipinfo/mmdbctl).

* Export the [test GeoIP2-Country.mmdb database](https://raw.githubusercontent.com/maxmind/MaxMind-DB/main/test-data/GeoIP2-Country-Test.mmdb)

```bash
mmdbctl export -f json ./GeoIP2-Country.mmdb
```

* Take one line from that file; replace the value for `range` with `0.0.0.0/0` (i.e. all IPv4 addresses); save as e.g. `always_us.json`

* Create a new database

```bash
mmdbctl import always_us.json always_us.mmdb
```

* The babel apps expect `GeoIP2-Country.mmdb` to be present; create a symlink to the one you want to use:

```bash
ln -s always_us.mmdb GeoIP2-Country.mmdb
```
