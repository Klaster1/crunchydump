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
Dump everything into MongoDB
```shell
cruncnydump --dump
```
All files are downloaded into current working dir.
###Dumping into DB
Crunchydump can crawl API and dump all gathered data into database. For this to work, you'll have to install [MongoDB](https://www.mongodb.org/downloads). Don't forget to run `mongod` before start.

#Known issues

 1. Image composing is not implemented. There are some missing page images that can be fixed this way.
 2. Volume and series downloading was not implemented because both functions require premium subscription.
