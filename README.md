# Ohtuilmo

[![PROD](https://github.com/Ohtuilmo/ohtuilmo/actions/workflows/production.yaml/badge.svg)](https://github.com/Ohtuilmo/ohtuilmo/actions/workflows/staging.yaml)
[![CI](https://github.com/Ohtuilmo/ohtuilmo/actions/workflows/staging.yaml/badge.svg)](https://github.com/Ohtuilmo/ohtuilmo/actions/workflows/staging.yaml)
[![Ohtuilmo](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/detailed/2e43ni/main&style=flat&logo=cypress)](https://cloud.cypress.io/projects/2e43ni/runs)

Registration, administration and review tool for University of Helsinki's software engineering project course.

## Development

### How to start development

1.  Make sure you have docker and docker compose installed.

2.  Clone this repository to your computer.

3.  Run `docker compose up` in any folder inside cloned repository to start development containers.
    - It will start 4 containers:

      | Container | Port |
      | --------- | ---- |
      | db        | 5432 |
      | backend   | 3001 |
      | frontend  | 3000 |
      | adminer   | 8083 |

4.  When you are done, close containers from the active console with shortcut `CTRL+C` or from other console with command `docker compose down`.

### When there is change in dependencies

If frontend or backend dependencies change, ie. there is change in frontend or backend package.json file, you need to rebuild containers:

1. Remove dev containers with command `docker compose down`

2. Rebuild dev containers with `docker compose up --build`

### How to restore database to its initial state

1. Remove containers and volumes related with command `docker compose down --volumes`

2. Restart dev setup with `docker compose up`

### How to change user roles in dev environment

In development environment, login is faked in backend using fakeshibbo middleware. You can run software in different user roles by modifying faceshibbo in `./backend/middleware.js` file.

To modify the currently used user, you can press one of the Role buttons on the Navbar. After that all requests to the backend will made be as an user with the selected role.

## How to run Cypress tests

1. Switch to frontend folder.

2. Start test setup with command `npm run test-setup`. This will create 4 containers:

   | Container | Port |
   | --------- | :--: |
   | db        | 6543 |
   | backend   | 5001 |
   | frontend  | 5000 |
   | adminer   | 9090 |

3. Run tests with graphic interface with command `npm run test` or in headless mode with command `npm run test:headless`. (for headless you can specify the browser (e.g. firefox) with `npm run test:headless -- --browser firefox`)

4. If you want to restore test setup and the database to their initial stage, just run `npm run test-setup` again.

5. When you are done, you can remove containers and all related resources with command `npm run test-setup:down`

## How to manually inspect database

Development setup includes database management tool called Adminer. With Adminer, you can easily inspect and modify database by using your browser. When development containers are running, navigate to [http://localhost:8083/](http://localhost:8083/) and sign in with following info:

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| System   | PostgreSQL (important: otherwise login hangs) |
| Server   | db (or test-db when using test environment)   |
| Username | postgres                                      |
| Password | postgres                                      |
| Database | postgres                                      |

## Staging

<https://toska-staging.cs.helsinki.fi/projekti/>

After a successful staging build, the new version should appear on the staging-server in 15mins.

### Project links (legacy)

- [Definition of Done](/documentation/definition_of_done.md)
- [Work schedule](/documentation/work_schedule.md)
- [Team practices](/documentation/team_practices.md)
- [Product backlog](https://github.com/orgs/Ohtuilmo/projects/1)
- [Worked hours](https://docs.google.com/spreadsheets/d/e/2PACX-1vRnlawBu2lDWxWYNQsZnKCnWiG41CknVIywZnWhlX3j-18jG2Kyh2MxMxhKrqqTQkDnvm0NPfUBslDE/pubhtml)
- [Developer workflow instructions](/documentation/developer_workflow.md)
