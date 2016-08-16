## Get French job market data with Pôle Emploi

### Hello all,

this is a simple crawler we use [at Whire](http:whire.me "Check it out!").

It replicates data from [Pôle Emploi candidates website](http:candidat.pole-emploi.fr/marche-du-travail/accueil)
directly to your "./dest" repository!
Syncing it every other week will give you fresh insights on how market is evolving.

## So, what do you get?

For each state department and [each OGR code](http:www.pole-emploi.org/front/common/tools/load_file.html?galleryId=50717&galleryTitle=doc+technique+ROME),
you get a JSON file of data we could fetch (salary, contract types, tension between offer and demand...), representing the state of last week French job market.

Here is a WYSIWYG :

```javascript
 { moinsDe35: [ 1500, 4650 ],
   plusDe35: [ 1750, 7750 ],
   lastWeek: [ 294, 1563 ],
   lastYear: [ 12, 10 ],
   saison: false,
   months: [ 'Janvier', 'Mars', 'Octobre' ],
   families: [ 'Attachés commerciaux' ],
   charts:
    [ 'CDI:80.35',
      'Autre:8.93',
      'CDD  3 mois:7.05',
      'CDD <= 3 mois:3.1',
      'Intérim:0.57' ],
   code: '11383',
   zone: '75' }

   /**

   {
    moinsDe35: min to max salary for people under the age of 35
     plusDe35: min to max salary for people over the age of 35
     lastWeek: index0 is the number of offers last week, index1 the number of candidates
     lastYear: last year, this was the actual ratio between number of offers and number of candidates
     saison: is it a seasonal job?
     months: these are the months where recruitment intensifies
     families: families used internally at Pôle Emploi
     charts: ordered by appearance, it gives you the percentage of contract types for successful recruitments over last year
     code: this is your OGR code, use at your own convenience or not (probably not)
     zone: the state department where we got the data from
   }
   */
```


## To launch it,

simply

 >npm install

then,

 >npm start

to launch it silently, or

 >npm run verbose

to get the logs of each added file.


Feel free to use PM2 or to bind it to your DB rather than pushing to "./dest"!



## Questions or collaboration?

Send me an email : hugo at whire dot me!

Pull requests would also be greatly appreciated,
especially to parallelize the process!
