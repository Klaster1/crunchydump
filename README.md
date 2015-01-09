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
#Known issues

 1. I did not test if authorisation allows to download chapters viewable
    only with premium subscription.
 2. Image composing is not implemented. There are some missing page images that can be fixed programmatically.
 3. Volume and series downloading was not implemented because both functions require premium subscription.