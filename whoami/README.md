<br/>
<p align="center">
  <h1><code>whoami</code></h1>
  <br/>
</p>


## Table Of Contents

* [About the Project](#about-the-project)
* [Built With](#built-with)
* [Project Set Up and Installation](#project-set-up-and-installation)
* [Project Structure](#project-structure)
* [Design](#design)
* [Functionality](#functionality)
* [Usage](#usage)
* [Tests](#tests)
* [Hosting](#hosting)
* [Resources](#resources)

## About The Project

This section should clealy outline what the goal of this project is.
Here, one can talk about the intention, the problem, and how this is the solution.

This is a utility CGI to which we can point users who are attempting to diagnose access
issues. A Jira ticket can be appended to the URL and `whoami` will automatically
submit an internal comment on that ticket.


## Built With

- `mdp-lib`
- `Geo::IP`


## Project Set Up and Installation

Follow the instructions in the `babel` README file. There are no additional setup steps
required for `whoami`.


## Project Structure
```markdown
babel
└── whoami
    ├── README.md
    └── cgi
        └── whoami // Everything happens here
```

## Design

Logos and UI elements should come from `/htapps/babel/firebird-common`.

## Functionality

- If the user is logged in (`REMOTE_USER` set)"
  - Prints a bulleted list of credentials from `ENV` and GeoIP
  - Prints a bulleted list of `HTTP_COOKIE` values
  - If a Jira ticket is added to the URL (e.g., `cgi/whoami/DEV-XXX`
    - Submits am internal comment to the ticket with the aforementioned credentials
- Otherwise (`REMOTE_USER` unset)
  - Prompts the user to click a link to log in.

## Usage
The `whoami` app is intended only to gather information to be used by HathiTrust technical
staff in resolving access issues.

## Tests
There are currently no automated tests.

When testing functionality for a logged-in user, it may be necessary to add a line like
`SetEnv REMOTE_USER user@default.invalid` in `apache/000-default.conf`.

## Hosting
`whoami` runs under Docker and in the `babel` production environment.

## Resources
- `Geo::IP`
- If actual Jira calls are to be made, make sure the credentials listed in the `jira_request` routine
have been configured.
