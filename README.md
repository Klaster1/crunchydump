#Crunchydump
Crunchyroll manga downloader.
##Installation
```bash
npm install klaster1/crunchydump --global
```
##Usage
```shell
crunchydump [options]

Options:
   -u NAME, --user NAME                 User name
   -p PASSWORD, --password PASSWORD     Password
   -s NAME, --series NAME               Search series by name or it's portion
   -n NUMBER, --chapter-number NUMBER   Chapter number
   -i ID, --chapter-id ID               Chapter ID
   --host                               API host URL
   --db URL                             MongoDB URL  [mongodb://localhost:27017/crunchydump]
   --dump                               Dump everything into MongoDB
   --serve                              Run API mirror at http://localhost:3333/ serving data from <db>
```
###Examples
Download last chapter of *Space Brothers*
```shell
crunchydump -s space
```
Download chapter by ID
```shell
crunchydump -s space -i 1451
```
Download chapter by number
```shell
crunchydump -s space -n 1
```
Download with authorisation
```shell
crunchydump -s space -n 241 -u username -p password
```
All files are downloaded into current working dir.

Dump everything into MongoDB
```shell
cruncnydump --dump
```
Run local API mirror
```shell
crunchydump --serve
```
###Dumping into DB
Crunchydump can crawl API and dump all gathered data into database. For this to work, you'll have to install [MongoDB](https://www.mongodb.org/downloads). Don't forget to run `mongod` before start.
###Downloading from local DB
After you've dumped everything, it's possible to start local API mirror (default address is http://localhost:3333). With it running, add `--host "http://localhost:3333"` to every download command in order to use dumped data. This way you can maintain local Crunchyroll copy and bother less about expires free simulpub chapters. In this mode, user credentials are not required.
#Known issues

 1. Image composing is not implemented. There are some missing page images that can be fixed this way.
 2. Volume and series downloading was not implemented because both functions require premium subscription.
