# Newspack Development Environment

This is the initial environment setup to be used for [Newspack](#) development. It will be updated and refreshed soon.

## VVV setup

### Install VVV

The basic instructions for installing VVV are in their [documentation](https://varyingvagrantvagrants.org/docs/en-US/installation/software-requirements/). Complete setup per their instructions before continuing below.

### Create a New VVV Site

Adding a new site is as simple as adding it under the sites section of `vvv-custom.yml`.
If `vvv-custom.yml` does not exist, you can create it by copying `vvv-config.yml` to `vvv-custom.yml`.

Edit the `vvv-custom.yml` in the main VVV folder like this:
```
sites:

  .... other sites...

  newspack-dev:
    repo: https://github.com/Varying-Vagrant-Vagrants/custom-site-template-develop.git
    hosts:
      - dev.newspack.local
```

Be sure to indent correctly as whitespace matters in YAML files, VVV prefers to indent using 2 spaces.

After making changes to `vvv-custom.yml`, VVV always needs to be reprovisioned.
If the VVV is not already up and running, run `vagrant up --provision`.
Otherwise run `vagrant reload --provision` to update VVV with the new site.

### DB Access

To use the readily available phpMyAdmin that gets installed with VVV by default:
* http://vvv.test/database-admin/
* user: `root`
* pass: `root`

If using a custom DB client, you can either create a DB connection via an SSH tunnel, or use the "direct connection" functionality on port 3306 (created in new versions of VVV and has a simpler setup).

For a connection using a DB client via an SSH tunnel:
* host: `192.168.50.4`
* SSH user: `vagrant`
* SSH password: `vagrant` 
* host: `127.0.0.1`
* port: `3306`
* user: `root`
* pass: `root`

To use the direct connection, create a MySQL/MariaDB connection with the following credentials, based on the default VVV configuration values:
* host: `192.168.50.4`
* port: `3306`
* user: `external`
* pass: `external`

### VVV Dashboard and Docs

To access the additional tools available by default in VVV visit [http://vvv.test](http://vvv.test).

## Newspack Site Setup

### Plugin and Theme Installation

In order to install the Newspack Plugin or the Newspack Theme, first SSH into the VVV with `vagrant ssh`.

To install and activate the plugin, run from inside the VVV:
```
cd /srv/www/newspack-dev/public_html/src/wp-content/plugins && git clone https://github.com/Automattic/newspack-plugin.git && cd /srv/www/newspack-dev/public_html/src/wp-content/plugins/newspack-plugin && composer install && npm install && wp plugin activate newspack-plugin
```

To install and activate the theme, run from inside the VVV:
```
cd /srv/www/newspack-dev/public_html/src/wp-content/themes && git clone https://github.com/Automattic/newspack-theme.git && cd /srv/www/newspack-dev/public_html/src/wp-content/themes/newspack-theme && composer install && npm install && wp theme activate newspack-theme
```

### PHP Tests

#### Setting up PHP Tests

The tests environment should be set up only once for the site. VVV gets set up with PHPUnit by default. If the new Newspack site was created as described in the instructions above, it was provisioned with the test environment necessary to run the phpunit configuration, with just a little bit of configuration.

* create the `wp-tests-config.php` file:
```
cp /srv/www/wordpress-trunk/public_html/wp-tests-config-sample.php /srv/www/newspack-dev/public_html/wp-tests-config.php
```

* update the DB credentials, `vim wp-tests-config.php`:
```
define( 'DB_NAME', 'newspackdev' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', 'root' );
```

#### Running the phpunit Tests

Run the tests:
```
cd /srv/www/newspack-dev/public_html/src/wp-content/plugins/newspack-plugin/
export WP_TESTS_DIR=/srv/www/newspack-dev/public_html/tests/phpunit/ && phpunit -c phpunit.xml
```

### Main Workflow

To develop a new feature, plugin or theme, use a standard workflow:
* create new feature branch
* push the branch to origin
* create a Pull Request
* pass code review
* merge branch to master
* delete the feature branch

## Use Cases

### Building a New Plugin

Creating a custom plugin for Newspack required creating a new repository in GitHub first. Once the new plugin repository is available, it is to be cloned following the same steps as described under "Plugin and Theme Installation".

### Importing Individual Publishers' Sites

TBD

### Content Syncing

TBD

### Building Guthenberg Blocks

TBD

# Next steps
* shared dev server instance
* automatic scripts provisioning

