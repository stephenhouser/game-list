# The Game Room Log

## About
Display list of games played and available in my game room!

Originally forked from [derekeder/csv-to-html-table](https://github.com/derekeder/csv-to-html-table), but later
converted to just using YAML data and jQuery DataTables directly.

Check out the live site: http://stephenhouser.github.io/game-room/


## About the Code

Originally adapted from [derekeder/csv-to-html-table](https://github.com/derekeder/csv-to-html-table). Which would convert CSV files for use by jQuery DataTables. I no longer use any of Derek's code, but have an appreciation and give thanks for his work.

Uses [jQuery](https://jquery.com), but only for the [jQuery DataTables](https://datatables.net) plugin.

Uses [Bootstrap Table](http://bootstrap-table.wenzhixin.net.cn) for the table display.

## Copyright

Copyright (c) 2017 Stephen Houser. Released under the [MIT License](https://github.com/stephenhouser/game-room/blob/master/LICENSE).


## NOTES

```
cat bgg-collection.xml| xq  '.items.item[] | .name | .["#text"]'
```

python -c 'import json; import yaml; print(yaml.dump(json.load(open("inputfile"))))'
