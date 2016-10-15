# Typeloy

A maintained and customized meteor-up, re-written in TypeScript.

*This project was forked from Arunoda Susiripala's meteor-up.
Thank you Arunoda Susiripala for the hard work*

### Difference

The difference between **typeloy** and **meteor-up**:

**New Requirements**

- Typeloy requires node v4.4+

**New Improvements**

- Support configuration span different sites, each site config may contains multiple servers. When deploying, site names could be specified to deploy app to the specific sites.

- Show information as much as possible in the console. like .. what version of node will be installed ... 

- Reuse bundle file if you want, so you don't have to re-build for just debugging the deployment:

        typeloy deploy --no-clean --tag v0.0.3 site

        typeloy deploy --build-dir /tmp --tag v0.0.3 site
        
        typeloy deploy --tag test-build --no-clean site

    Send your existing bundle file without rebuilding the tarball file:

        typeloy deploy --bundle-file /tmp/bundle.tar.gz /tmp v0.0.3

- Don't export environment variables with weird escaping.

- Automatically fix the npm bcrypt invalid elf binary issue in the deploy script.

- Require node v4.4.7+

- Tested with Meteor 1.3 and 1.4

**New Features**

- Supports LetEncrypt. You can easily configure/setup certbot on servers and get ssl certification easily renewed.
- Supports both systemd and upstart.
- Added commander integration.
- Added `--build-dir`, `--bundle-file`, `--no-clean`, `--tag` options to the deploy command.
- Added options for customzing build options like "architecture" and "server":

          {
              "build": {
                  // optional: build arch
                  "architecture": "os.linux.x86_64",

                  // optional: server option for --server http://localhost:3000 (for mobile app)
                  "server": "http://localhost:3000"
              }
          }


### Installation

    npm install -g typeloy

### Config File

Typeloy uses its own config but the config format is backward-compatible
with `mup.json`.

The config filename will be checked by this order:

`typeloy.js`, `typeloy.json`, `typeloy.config.json`.

For the new config structure please check [the example config file](https://github.com/c9s/typeloy/blob/master/example/typeloy.json)

#### Production Quality Meteor Deployments

Typeloy is a command line tool that allows you to deploy any [Meteor](http://meteor.com) app to your own server. It supports only Debian/Ubuntu flavours and Open Solaris at the moments. (PRs are welcome)

You can use install and use Meteor Up from Linux, Mac and Windows.

> Screencast: [How to deploy a Meteor app with Meteor Up (by Sacha Greif)](https://www.youtube.com/watch?v=WLGdXtZMmiI)

**Table of Contents**

- [Features](#features)
- [Server Configuration](#server-configuration)
    - [SSH-key-based authentication (with passphrase)](#ssh-keys-with-passphrase-or-ssh-agent-support)
- [Installation](#installation)
- [Creating a Meteor Up Project](#creating-a-meteor-up-project)
- [Setting Up a Server](#setting-up-a-server)
- [Deploying an App](#deploying-an-app)
- [Additional Setup/Deploy Information](#additional-setupdeploy-information)
    - [Server Setup Details](#server-setup-details)
    - [Deploy Wait Time](#deploy-wait-time)
    - [Multiple Deployment Targets](#multiple-deployment-targets)
- [Access Logs](#access-logs)
- [Reconfiguring & Restarting](#reconfiguring--restarting)
- [Accessing the Database](#accessing-the-database)
- [Multiple Deployments](#multiple-deployments)
- [Server Specific Environment Variables](#server-specific-environment-variables)
- [SSL Support](#ssl-support)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [Binary Npm Module Support](#binary-npm-module-support)
- [Additional Resources](#additional-resources)

### Features

* Single command server setup
* Single command deployment
* Multi server deployment
* Environmental Variables management
* Support for [`settings.json`](http://docs.meteor.com/#meteor_settings)
* Password or Private Key(pem) based server authentication
* Access, logs from the terminal (supports log tailing)
* Support for multiple meteor deployments (experimental)

### Server Configuration

* Auto-Restart if the app crashed (using forever)
* Auto-Start after the server reboot (using upstart)
* Stepdown User Privileges
* Revert to the previous version, if the deployment failed
* Secured MongoDB Installation (Optional)
* Pre-Installed PhantomJS (Optional)

### Creating a Meteor Up Project

    mkdir ~/my-meteor-deployment
    cd ~/my-meteor-deployment
    typeloy init

This will create two files in your Meteor Up project directory:

  * typeloy.json - Meteor Up configuration file
  * settings.json - Settings for Meteor's [settings API](http://docs.meteor.com/#meteor_settings)

`typeloy.json` is commented and easy to follow (it supports JavaScript comments).

### Setting Up a Server

    typeloy setup [site1] [site2] ...

This will setup the server for the `mup` deployments. It will take around 2-5 minutes depending on the server's performance and network availability.

### Deploying an App

    typeloy deploy [site1] [site2] ...

This will bundle the Meteor project and deploy it to the server.

### Additional Setup/Deploy Information

#### SSH keys with passphrase (or ssh-agent support)

> This only tested with Mac/Linux

With the help of `ssh-agent`, `mup` can use SSH keys encrypted with a
passphrase.

Here's the process:

* First remove your `pem` field from the `typeloy.json`. So, your `typeloy.json` only has the username and host only.
* Then start a ssh agent with `eval $(ssh-agent)`
* Then add your ssh key with `ssh-add <path-to-key>`
* Then you'll asked to enter the passphrase to the key
* After that simply invoke `mup` commands and they'll just work
* Once you've deployed your app kill the ssh agent with `ssh-agent -k`

#### Ssh based authentication with `sudo`

**If your username is `root`, you don't need to follow these steps**

Please ensure your key file (pem) is not protected by a passphrase. Also the setup process will require NOPASSWD access to sudo. (Since Meteor needs port 80, sudo access is required.)

Make sure you also add your ssh key to the ```/YOUR_USERNAME/.ssh/authorized_keys``` list

You can add your user to the sudo group:

    sudo adduser *username*  sudo

And you also need to add NOPASSWD to the sudoers file:

    sudo visudo

    # replace this line
    %sudo  ALL=(ALL) ALL

    # by this line
    %sudo ALL=(ALL) NOPASSWD:ALL  

When this process is not working you might encounter the following error:

    'sudo: no tty present and no askpass program specified'

#### Server Setup Details

This is how Meteor Up will configure the server for you based on the given `appName` or using "meteor" as default appName. This information will help you customize the server for your needs.

* your app lives at `/opt/<appName>/app`
* mup uses `upstart` with a config file at `/etc/init/<appName>.conf`
* you can start and stop the app with upstart: `start <appName>` and `stop <appName>`
* logs are located at: `/var/log/upstart/<appName>.log`
* MongoDB installed and bound to the local interface (cannot access from the outside)
* the database is named `<appName>`

For more information see [`lib/taskLists.js`](https://github.com/arunoda/meteor-up/blob/master/lib/taskLists.js).

#### Multiple Deployment Targets

You can use an array to deploy to multiple servers at once.

To deploy to *different* environments (e.g. staging, production, etc.), use separate Meteor Up configurations in separate directories, with each directory containing separate `typeloy.json` and `settings.json` files, and the `typeloy.json` files' `app` field pointing back to your app's local directory.

#### Custom Meteor Binary

Sometimes, you might be using `mrt`, or Meteor from a git checkout. By default, Meteor Up uses `meteor`. You can ask Meteor Up to use the correct binary with the `meteorBinary` option.

```js
{
  "meteor": {
    "env": { "PACKAGE_DIRS": "../private-packages" },
    "binary": "~/bin/meteor/meteor"
  }
}
```

### Checking Logs

Typeloy can tail logs from the server and supports all the options of `tail`

    typeloy logs

Supported also the realtime logs monitoring

    typeloy logs -f

### Reconfiguring & Restarting

After you've edit environmental variables or `settings.json`, you can reconfigure the app without deploying again. Use the following command to do update the settings and restart the app.

    typeloy reconfig

If you want to stop, start or restart your app for any reason, you can use the following commands to manage it.

    typeloy stop
    typeloy start
    typeloy restart

### Accessing the Database

You can't access the MongoDB from the outside the server. To access the MongoDB shell you need to log into your server via SSH first and then run the following command:

    mongo appName

### Server Specific Environment Variables

It is possible to provide server specific environment variables. Add the `env` object along with the server details in the `typeloy.json`. Here's an example:

```js
{
  "servers": [
    {
      "host": "hostname",
      "username": "root",
      "password": "password",
      "env": {
        "SOME_ENV": "the-value"
      }
    }
}
```

By default, Meteor UP adds `CLUSTER_ENDPOINT_URL` to make [cluster](https://github.com/meteorhacks/cluster) deployment simple. But you can override it by defining it yourself.

### Multiple Deployments

Meteor Up supports multiple deployments to a single server. Meteor Up only does the deployment; if you need to configure subdomains, you need to manually setup a reverse proxy yourself.

Let's assume, we need to deploy production and staging versions of the app to the same server. The production app runs on port 80 and the staging app runs on port 8000.

We need to have two separate Meteor Up projects. For that, create two directories and initialize Meteor Up and add the necessary configurations.

In the staging `typeloy.json`, add a field called `appName` with the value `staging`. You can add any name you prefer instead of `staging`. Since we are running our staging app on port 8000, add an environment variable called `PORT` with the value 8000.

Now setup both projects and deploy as you need.

### SSL Support

Meteor Up has the built in SSL support. It uses [stud](https://github.com/bumptech/stud) SSL terminator for that. First you need to get a SSL certificate from some provider. This is how to do that:

* [First you need to generate a CSR file and the private key](http://www.rackspace.com/knowledge_center/article/generate-a-csr-with-openssl)
* Then purchase a SSL certificate.
* Then generate a SSL certificate from your SSL providers UI.
* Then that'll ask to provide the CSR file. Upload the CSR file we've generated.
* When asked to select your SSL server type, select it as nginx.
* Then you'll get a set of files (your domain certificate and CA files).

Now you need combine SSL certificate(s) with the private key and save it in the mup config directory as `ssl.pem`. Check this [guide](http://alexnj.com/blog/configuring-a-positivessl-certificate-with-stud) to do that.

Then add following configuration to your `typeloy.json` file.

```js
{
  "ssl": {
    "pem": "./ssl.pem",
    //"backendPort": 80
  }
  ...
}
```

If you're using letsencrypt, certbot setup/renew is also supported:

```js
{
  "sites": {
     "myapp": {
        "servers": [ ... ],
        "ssl": {
            "certbot": {
                "email": "your@email.com",
                "domain": "thedomain.com"
            }
        }
     }
  }
}
```
Now, simply do `typeloy setup` and now you've the SSL support.

> * By default, it'll think your Meteor app is running on port 80. If it's not, change it with the `backendPort` configuration field.
> * SSL terminator will run on the default SSL port `443`
> * If you are using multiple servers, SSL terminators will run on the each server (This is made to work with [cluster](https://github.com/meteorhacks/cluster))
> * Right now, you can't have multiple SSL terminators running inside a single server

### Updating

To update `typeloy` to the latest version, just type:

    npm update typeloy -g

You should try and keep `typeloy` up to date in order to keep up with the latest Meteor changes. But note that if you need to update your Node version, you'll have to run `typeloy setup` again before deploying.

### Troubleshooting

#### Check Access

Your issue might not always be related to Meteor Up. So make sure you can connect to your instance first, and that your credentials are working properly.

#### Check Logs
If you suddenly can't deploy your app anymore, first use the `typeloy logs -f` command to check the logs for error messages.

One of the most common problems is your Node version getting out of date. In that case, see “Updating” section above.

#### Verbose Output
If you need to see the output of `meteor-up` (to see more precisely where it's failing or hanging, for example), run it like so:

    DEBUG=* typeloy <command>

where `<command>` is one of the `typeloy` commands such as `setup`, `deploy`, etc.

### Binary Npm Module Support

Some of the Meteor core packages as well some of the community packages comes with npm modules which has been written in `C` or `C++`. These modules are platform dependent.
So, we need to do special handling, before running the bundle generated from `meteor bundle`.
(meteor up uses the meteor bundle)

Fortunately, Meteor Up **will take care** of that job for you and it will detect binary npm modules and re-build them before running your app on the given server.

> * Meteor 0.9 adds a similar feature where it allows package developers to publish their packages for different architecures, if their packages has binary npm modules.
> * As a side effect of that, if you are using a binary npm module inside your app via `meteorhacks:npm` package, you won't be able to deploy into `*.meteor.com`.
> * But, you'll be able to deploy with Meteor Up since we are re-building binary modules on the server.

### Additional Resources

* [Using Meteor Up with Nitrous.io](https://github.com/arunoda/meteor-up/wiki/Using-Meteor-Up-with-Nitrous.io)
* [Change Ownership of Additional Directories](https://github.com/arunoda/meteor-up/wiki/Change-Ownership-of-Additional-Directories)
* [Using Meteor Up with NginX vhosts](https://github.com/arunoda/meteor-up/wiki/Using-Meteor-Up-with-NginX-vhosts)


### LICENSE

This package was forked from arunoda/meteor-up and is released under MIT.

### Roadmap

- [x] TypeScript integration
- [x] Add commander integration
- [x] `BUILD_DIR` should be the deploy version name.
- [x] `--bundle-file [path]` option to reuse pre-built bundle tarball file.
- [x] Collecting deployment metadata and pass to the handler of different phases.
- [x] Add plugin architect
    - [x] Slack plugin to integrate Slack notification
- [x] Add server list site name support
- [x] SystemD init support
- [x] Add promise support for the actions.
- [x] Remove process.exit from code
- [x] Ability to deploy just one site from the multiple server list.
- [x] Run specific setup tasks on servers.
- [x] Auto deployment
- [x] Provide easy-to-use nodejs API.
- [ ] Docker composer support

