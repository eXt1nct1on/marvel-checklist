# TMDB Poster Acquisition Report

Generated on **2026-10-06** via `scripts/fetch-posters.mjs`.

## Summary
- **Total Titles Processed**: 199
- **Matched with Poster**: 191
- **Low-Confidence Matches**: 23
- **Year Mismatches**: 3
- **Unmatched Titles**: 8
- **Skipped (Already cached)**: 0

## Low-Confidence Matches
*These titles had slight title or year discrepancies. If a match is incorrect, add an entry to `data/tmdb-overrides.json`.*

| ID | Catalog Title | TMDB Title | Catalog Year | TMDB Year | TMDB ID |
|---|---|---|---|---|---|
| `x2-x-men-united-2003` | X2: X-Men United | X2 | 2003 | 2003 | [36658](https://www.themoviedb.org/movie/36658) |
| `batman-the-dark-knight-returns-2012` | Batman: The Dark Knight Returns | Batman: The Dark Knight Returns, Part 1 | 2012 | 2012 | [123025](https://www.themoviedb.org/movie/123025) |
| `agents-of-s-h-i-e-l-d-2013` | Agents of S.H.I.E.L.D. | Marvel's Agents of S.H.I.E.L.D. | 2013 | 2013 | [1403](https://www.themoviedb.org/movie/1403) |
| `agent-carter-2015` | Agent Carter | Marvel's Agent Carter | 2015 | 2015 | [61550](https://www.themoviedb.org/movie/61550) |
| `daredevil-2015` | Daredevil | Marvel's Daredevil | 2015 | 2015 | [61889](https://www.themoviedb.org/movie/61889) |
| `fantastic-four-2015` | Fant4stic | Fantastic Four | 2015 | 2015 | [166424](https://www.themoviedb.org/movie/166424) |
| `jessica-jones-2015` | Jessica Jones | Marvel's Jessica Jones | 2015 | 2015 | [38472](https://www.themoviedb.org/movie/38472) |
| `luke-cage-2016` | Luke Cage | Marvel's Luke Cage | 2016 | 2016 | [62126](https://www.themoviedb.org/movie/62126) |
| `marvel-one-shot-team-thor-2016` | Marvel One-Shot: Team Thor | Team Thor | 2016 | 2016 | [413279](https://www.themoviedb.org/movie/413279) |
| `inhumans-2017` | Inhumans | Marvel's Inhumans | 2017 | 2017 | [68716](https://www.themoviedb.org/movie/68716) |
| `iron-fist-2017` | Iron Fist | Marvel's Iron Fist | 2017 | 2017 | [62127](https://www.themoviedb.org/movie/62127) |
| `runaways-2017` | Runaways | Marvel's Runaways | 2017 | 2017 | [67466](https://www.themoviedb.org/movie/67466) |
| `the-defenders-2017` | The Defenders | Marvel's The Defenders | 2017 | 2017 | [62285](https://www.themoviedb.org/movie/62285) |
| `the-punisher-2017` | The Punisher | Marvel's The Punisher | 2017 | 2017 | [67178](https://www.themoviedb.org/movie/67178) |
| `cloak-and-dagger-2018` | Cloak & Dagger | Marvel's Cloak & Dagger | 2018 | 2018 | [66190](https://www.themoviedb.org/movie/66190) |
| `birds-of-prey-2020` | Birds of Prey | Birds of Prey (and the Fantabulous Emancipation of One Harley Quinn) | 2020 | 2020 | [495764](https://www.themoviedb.org/movie/495764) |
| `i-am-groot-2022` | I Am Groot | The Little Guy | 2022 | 2022 | [1010819](https://www.themoviedb.org/movie/1010819) |
| `thunderbolts-2025` | Thunderbolts* | Thunderbolts* | 2025 | 2025 | [986056](https://www.themoviedb.org/movie/986056) |
| `the-fantastic-four-first-steps-2025` | The Fantastic Four: First Steps | The Fantastic 4: First Steps | 2025 | 2025 | [617126](https://www.themoviedb.org/movie/617126) |
| `vision-quest-2026` | Vision Quest | VisionQuest | 2026 | 2026 | [213375](https://www.themoviedb.org/movie/213375) |
| `the-batman-part-ii-2027` | The Batman Part II | The Batman: Part II | 2027 | 2028 | [806704](https://www.themoviedb.org/movie/806704) |
| `shang-chi-2-tbd` | Shang-Chi 2 | Untitled Shang-Chi and the Legend of the Ten Rings Sequel | TBD | TBD | [1737233](https://www.themoviedb.org/movie/1737233) |
| `the-authority-tbd` | The Authority | Man-Slashing Horse-Piercing Sword | TBD | 1929 | [467025](https://www.themoviedb.org/movie/467025) |

## Year Mismatches
*Differences between catalog release year and TMDB release/first-air year. Useful for detecting inaccurate dates in data.js.*

| ID | Title | Catalog Year | TMDB Year | Diff | TMDB ID |
|---|---|---|---|---|---|
| `v-for-vendetta-2005` | V for Vendetta | 2005 | 2006 | +1 | [752](https://www.themoviedb.org/movie/752) |
| `wonder-man-2025` | Wonder Man | 2025 | 2026 | +1 | [198178](https://www.themoviedb.org/movie/198178) |
| `the-batman-part-ii-2027` | The Batman Part II | 2027 | 2028 | +1 | [806704](https://www.themoviedb.org/movie/806704) |

## Unmatched Titles
*Titles that could not be found automatically. Override them in `data/tmdb-overrides.json`.*

| ID | Catalog Title | Year | Search Query |
|---|---|---|---|
| `the-flash-series-2014` | The Flash (Series) | 2014 | `The Flash (Series)` |
| `supergirl-series-2015` | Supergirl (Series) | 2015 | `Supergirl (Series)` |
| `marvel-studios-legends-2021` | Marvel Studios: Legends | 2021 | `Marvel Studios: Legends` |
| `armor-wars-tbd` | Armor Wars | TBD | `Armor Wars` |
| `booster-gold-tbd` | Booster Gold | TBD | `Booster Gold` |
| `sgt-rock-tbd` | Sgt. Rock | TBD | `Sgt. Rock` |
| `the-brave-and-the-bold-tbd` | The Brave and the Bold | TBD | `The Brave and the Bold` |
| `waller-tbd` | Waller | TBD | `Waller` |

## Matched Titles (191)

| ID | Catalog Title | TMDB Title | Year | TMDB ID | Poster Path |
|---|---|---|---|---|---|
| `superman-1978` | Superman | Superman | 1978 | 1924 | `/d7px1FQxW4tngdACVRsCSaZq0Xl.jpg` |
| `superman-ii-1980` | Superman II | Superman II | 1980 | 8536 | `/3xk5cno9BHcnwc97XO9k21aI1Zi.jpg` |
| `swamp-thing-1982` | Swamp Thing | Swamp Thing | 1982 | 17918 | `/7BGaE9A7UeyxH29aeFbQfzEmIi0.jpg` |
| `superman-iii-1983` | Superman III | Superman III | 1983 | 9531 | `/c4oR6qgZW2s5foGkQi2Dd86KuAS.jpg` |
| `supergirl-1984` | Supergirl | Supergirl | 1984 | 9651 | `/o49a2RDChZkry84LomEORCPDWfk.jpg` |
| `howard-the-duck-1986` | Howard the Duck | Howard the Duck | 1986 | 10658 | `/30tnH0hy6S5FjGCfCdnkBd3wqS2.jpg` |
| `superman-iv-the-quest-for-peace-1987` | Superman IV: The Quest for Peace | Superman IV: The Quest for Peace | 1987 | 11411 | `/nJFBeU1oKIaIoLVyQYUeB36DW55.jpg` |
| `batman-1989` | Batman | Batman | 1989 | 268 | `/cij4dd21v2Rk2YtUQbV5kW69WB2.jpg` |
| `the-punisher-1989` | The Punisher | The Punisher | 1989 | 8867 | `/tA0O0hYyHX7Hl2Fl8VEtGtfBtjI.jpg` |
| `the-return-of-swamp-thing-1989` | The Return of Swamp Thing | The Return of Swamp Thing | 1989 | 19142 | `/5sm1Yi1hgj805b9o2a1uC6BXhqw.jpg` |
| `captain-america-1990` | Captain America | Captain America | 1990 | 13995 | `/vdHrLFfHcJX9nlvUfG3LK2a2hq4.jpg` |
| `batman-returns-1992` | Batman Returns | Batman Returns | 1992 | 364 | `/jKBjeXM7iBBV9UkUcOXx3m7FSHY.jpg` |
| `batman-mask-of-the-phantasm-1993` | Batman: Mask of the Phantasm | Batman: Mask of the Phantasm | 1993 | 14919 | `/hT4ehUteagUrhUOHAtmYiY7mp5l.jpg` |
| `batman-forever-1995` | Batman Forever | Batman Forever | 1995 | 414 | `/i0fJS8M5UKoETjjJ0zwUiKaR8tr.jpg` |
| `batman-and-robin-1997` | Batman & Robin | Batman & Robin | 1997 | 415 | `/i7hEUpDuMN2LOrCEifFyGSHZQSY.jpg` |
| `steel-1997` | Steel | Steel | 1997 | 8854 | `/ufA7d5LT2rGj58KaZErPhcMkJ4U.jpg` |
| `blade-1998` | Blade | Blade | 1998 | 36647 | `/oWT70TvbsmQaqyphCZpsnQR7R32.jpg` |
| `x-men-2000` | X-Men | X-Men | 2000 | 36657 | `/bRDAc4GogyS9ci3ow7UnInOcriN.jpg` |
| `blade-ii-2002` | Blade II | Blade II | 2002 | 36586 | `/wAn6VYamKbnOtfyTZ6arVtkMzDv.jpg` |
| `spider-man-2002` | Spider-Man | Spider-Man | 2002 | 557 | `/or6XJBVpcEbIkma0V9zshnbEtx4.jpg` |
| `daredevil-2003` | Daredevil | Daredevil | 2003 | 9480 | `/oCDBwSkntYamuw8VJIxMRCtDBmi.jpg` |
| `hulk-2003` | Hulk | Hulk | 2003 | 1927 | `/UllIft2jLSBaay3zQyMV4GNdfy.jpg` |
| `x2-x-men-united-2003` | X2: X-Men United | X2 | 2003 | 36658 | `/bst4alFUXCxISwdRUKSMhhkrX1M.jpg` |
| `blade-trinity-2004` | Blade: Trinity | Blade: Trinity | 2004 | 36648 | `/6f7iXvPOnf83MaLB1JmPzUor1rr.jpg` |
| `catwoman-2004` | Catwoman | Catwoman | 2004 | 314 | `/pvnPgukFyEKgCzyOxyLiwyZ8T1C.jpg` |
| `spider-man-2-2004` | Spider-Man 2 | Spider-Man 2 | 2004 | 558 | `/aGuvNAaaZuWXYQQ6N2v7DeuP6mB.jpg` |
| `the-punisher-2004` | The Punisher | The Punisher | 2004 | 7220 | `/7rmA1HwYp2GKM85BL0cVwCaosGr.jpg` |
| `batman-begins-2005` | Batman Begins | Batman Begins | 2005 | 272 | `/sPX89Td70IDDjVr85jdSBb4rWGr.jpg` |
| `constantine-2005` | Constantine | Constantine | 2005 | 561 | `/vPYgvd2MwHlxTamAOjwVQp4qs1W.jpg` |
| `elektra-2005` | Elektra | Elektra | 2005 | 9947 | `/Z4dAOxjAHTUZO6DJ2WVAsxzwe3.jpg` |
| `fantastic-four-2005` | Fantastic Four | Fantastic Four | 2005 | 9738 | `/4YMcYEFS8sFuW3soP1HVmgR3cSm.jpg` |
| `man-thing-2005` | Man-Thing | Man-Thing | 2005 | 18882 | `/kfPPnOygXSGaBFpsCUyu7xQdkoO.jpg` |
| `v-for-vendetta-2005` | V for Vendetta | V for Vendetta | 2006 | 752 | `/1avD1JeaRiJX5M4ahPdZPypGoGN.jpg` |
| `superman-returns-2006` | Superman Returns | Superman Returns | 2006 | 1452 | `/385XwTQZDpRX2d3kxtnpiLrjBXw.jpg` |
| `x-men-the-last-stand-2006` | X-Men: The Last Stand | X-Men: The Last Stand | 2006 | 36668 | `/a2xicU8DpKtRizOHjQLC1JyCSRS.jpg` |
| `fantastic-four-rise-of-the-silver-surfer-2007` | Fantastic Four: Rise of the Silver Surfer | Fantastic Four: Rise of the Silver Surfer | 2007 | 1979 | `/9wRfzTcMyyzkQxVDqBHv8RwuZOv.jpg` |
| `ghost-rider-2007` | Ghost Rider | Ghost Rider | 2007 | 1250 | `/4quwR1VwZouD0YF9AaD72kQAjxH.jpg` |
| `spider-man-3-2007` | Spider-Man 3 | Spider-Man 3 | 2007 | 559 | `/qFmwhVUoUSXjkKRmca5yGDEXBIj.jpg` |
| `iron-man-2008` | Iron Man | Iron Man | 2008 | 1726 | `/78lPtwv72eTNqFW9COBYI0dWDJa.jpg` |
| `punisher-war-zone-2008` | Punisher: War Zone | Punisher: War Zone | 2008 | 13056 | `/oOvKJgYUIpfswGHAdW6159bPbvM.jpg` |
| `the-dark-knight-2008` | The Dark Knight | The Dark Knight | 2008 | 155 | `/qJ2tW6WMUDux911r6m7haRef0WH.jpg` |
| `the-incredible-hulk-2008` | The Incredible Hulk | The Incredible Hulk | 2008 | 1724 | `/gKzYx79y0AQTL4UAk1cBQJ3nvrm.jpg` |
| `watchmen-2009` | Watchmen | Watchmen | 2009 | 13183 | `/aVURelN3pM56lFM7Dgfs5TixcIf.jpg` |
| `x-men-origins-wolverine-2009` | X-Men Origins: Wolverine | X-Men Origins: Wolverine | 2009 | 2080 | `/yj8LbTju1p7CUJg7US2unSBk33s.jpg` |
| `batman-under-the-red-hood-2010` | Batman: Under the Red Hood | Batman: Under the Red Hood | 2010 | 40662 | `/7lmHqHg1rG9b4U8MjuyQjmJ7Qm0.jpg` |
| `iron-man-2-2010` | Iron Man 2 | Iron Man 2 | 2010 | 10138 | `/6WBeq4fCfn7AN0o21W9qNcRF2l9.jpg` |
| `jonah-hex-2010` | Jonah Hex | Jonah Hex | 2010 | 20533 | `/xwAdu0lOO2Y5sXjK87glhJg3c6r.jpg` |
| `captain-america-the-first-avenger-2011` | Captain America: The First Avenger | Captain America: The First Avenger | 2011 | 1771 | `/vSNxAJTlD0r02V9sPYpOjqDZXUK.jpg` |
| `ghost-rider-spirit-of-vengeance-2011` | Ghost Rider: Spirit of Vengeance | Ghost Rider: Spirit of Vengeance | 2011 | 71676 | `/xEoBT6lYfQNpSpTm8gJMTrQytiw.jpg` |
| `green-lantern-2011` | Green Lantern | Green Lantern | 2011 | 44912 | `/fj21HwUprqjjwTdkKC1XZurRSpV.jpg` |
| `thor-2011` | Thor | Thor | 2011 | 10195 | `/prSfAi1xGrhLQNxVSUFh61xQ4Qy.jpg` |
| `x-men-first-class-2011` | X-Men: First Class | X-Men: First Class | 2011 | 49538 | `/hNEokmUke0dazoBhttFN0o3L7Xv.jpg` |
| `marvel-one-shot-the-consultant-2011` | Marvel One-Shot: The Consultant | Marvel One-Shot: The Consultant | 2011 | 76122 | `/xqNLXUUvBnfVk6m3QFGGU0Grgs7.jpg` |
| `marvel-one-shot-a-funny-thing-happened-on-the-way-to-thors-hammer-2011` | Marvel One-Shot: A Funny Thing Happened on the Way to Thor's Hammer | Marvel One-Shot: A Funny Thing Happened on the Way to Thor's Hammer | 2011 | 76535 | `/njrOqsmFH4pxBrhcoslqLfw2OGk.jpg` |
| `arrow-2012` | Arrow | Arrow | 2012 | 1412 | `/u8ZHFj1jC384JEkTt3vNg1DfWEb.jpg` |
| `batman-the-dark-knight-returns-2012` | Batman: The Dark Knight Returns | Batman: The Dark Knight Returns, Part 1 | 2012 | 123025 | `/rVr2Tdp2LcL3DheXUrVN345Myhg.jpg` |
| `the-amazing-spider-man-2012` | The Amazing Spider-Man | The Amazing Spider-Man | 2012 | 1930 | `/jexoNYnPd6vVrmygwF6QZmWPFdu.jpg` |
| `the-avengers-2012` | The Avengers | The Avengers | 2012 | 24428 | `/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg` |
| `the-dark-knight-rises-2012` | The Dark Knight Rises | The Dark Knight Rises | 2012 | 49026 | `/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg` |
| `marvel-one-shot-item-47-2012` | Marvel One-Shot: Item 47 | Marvel One-Shot: Item 47 | 2012 | 119569 | `/hnSxG8clwLuAXEkp9emc8HCUcHD.jpg` |
| `agents-of-s-h-i-e-l-d-2013` | Agents of S.H.I.E.L.D. | Marvel's Agents of S.H.I.E.L.D. | 2013 | 1403 | `/gHUCCMy1vvj58tzE3dZqeC9SXus.jpg` |
| `iron-man-3-2013` | Iron Man 3 | Iron Man 3 | 2013 | 68721 | `/qhPtAc1TKbMPqNvcdXSOn9Bn7hZ.jpg` |
| `justice-league-the-flashpoint-paradox-2013` | Justice League: The Flashpoint Paradox | Justice League: The Flashpoint Paradox | 2013 | 183011 | `/hg6RYpSb3vU4i3yQDtE1YhSZNh5.jpg` |
| `man-of-steel-2013` | Man of Steel | Man of Steel | 2013 | 49521 | `/8GFtkImmK0K1VaUChR0n9O61CFU.jpg` |
| `the-wolverine-2013` | The Wolverine | The Wolverine | 2013 | 76170 | `/t2wVAcoRlKvEIVSbiYDb8d0QqqS.jpg` |
| `thor-the-dark-world-2013` | Thor: The Dark World | Thor: The Dark World | 2013 | 76338 | `/wp6OxE4poJ4G7c0U2ZIXasTSMR7.jpg` |
| `marvel-one-shot-agent-carter-2013` | Marvel One-Shot: Agent Carter | Marvel One-Shot: Agent Carter | 2013 | 211387 | `/4vFKKWPvCVDJTOWiwReBfpAMScP.jpg` |
| `captain-america-the-winter-soldier-2014` | Captain America: The Winter Soldier | Captain America: The Winter Soldier | 2014 | 100402 | `/tVFRpFw3xTedgPGqxW0AOI8Qhh0.jpg` |
| `guardians-of-the-galaxy-2014` | Guardians of the Galaxy | Guardians of the Galaxy | 2014 | 118340 | `/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg` |
| `the-amazing-spider-man-2-2014` | The Amazing Spider-Man 2 | The Amazing Spider-Man 2 | 2014 | 102382 | `/bU7nTmvmy0h3VUP01v1T2imgH6N.jpg` |
| `x-men-days-of-future-past-2014` | X-Men: Days of Future Past | X-Men: Days of Future Past | 2014 | 127585 | `/tYfijzolzgoMOtegh1Y7j2Enorg.jpg` |
| `marvel-one-shot-all-hail-the-king-2014` | Marvel One-Shot: All Hail the King | Marvel One-Shot: All Hail the King | 2014 | 253980 | `/y0QYZPWgeGKOvyrzi6Oz3aJPxJa.jpg` |
| `agent-carter-2015` | Agent Carter | Marvel's Agent Carter | 2015 | 61550 | `/fe79VYyLp5ZBstpJ4oukpuUT3B.jpg` |
| `ant-man-2015` | Ant-Man | Ant-Man | 2015 | 102899 | `/rQRnQfUl3kfp78nCWq8Ks04vnq1.jpg` |
| `avengers-age-of-ultron-2015` | Avengers: Age of Ultron | Avengers: Age of Ultron | 2015 | 99861 | `/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg` |
| `daredevil-2015` | Daredevil | Marvel's Daredevil | 2015 | 61889 | `/QWbPaDxiB6LW2LjASknzYBvjMj.jpg` |
| `fantastic-four-2015` | Fant4stic | Fantastic Four | 2015 | 166424 | `/cDroz5qSlP8xZ6tOpeYoPkBvKyL.jpg` |
| `jessica-jones-2015` | Jessica Jones | Marvel's Jessica Jones | 2015 | 38472 | `/oxnWofiE9fHOgUfs9NJa6nG6NTR.jpg` |
| `batman-v-superman-dawn-of-justice-2016` | Batman v Superman: Dawn of Justice | Batman v Superman: Dawn of Justice | 2016 | 209112 | `/5UsK3grJvtQrtzEgqNlDljJW96w.jpg` |
| `captain-america-civil-war-2016` | Captain America: Civil War | Captain America: Civil War | 2016 | 271110 | `/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg` |
| `dcs-legends-of-tomorrow-2016` | DC's Legends of Tomorrow | DC's Legends of Tomorrow | 2016 | 62643 | `/qNgAcg4gNYbZ9mySLB9ZX4ehZb6.jpg` |
| `deadpool-2016` | Deadpool | Deadpool | 2016 | 293660 | `/3E53WEZJqP6aM84D8CckXx4pIHw.jpg` |
| `doctor-strange-2016` | Doctor Strange | Doctor Strange | 2016 | 284052 | `/uGBVj3bEbCoZbDjjl9wTxcygko1.jpg` |
| `luke-cage-2016` | Luke Cage | Marvel's Luke Cage | 2016 | 62126 | `/yzM1hMB3PUJqbISX0f421b3xOjB.jpg` |
| `suicide-squad-2016` | Suicide Squad | Suicide Squad | 2016 | 297761 | `/sk3FZgh3sRrmr8vyhaitNobMcfh.jpg` |
| `x-men-apocalypse-2016` | X-Men: Apocalypse | X-Men: Apocalypse | 2016 | 246655 | `/ikA8UhYdTGpqbatFa93nIf6noSr.jpg` |
| `marvel-one-shot-team-thor-2016` | Marvel One-Shot: Team Thor | Team Thor | 2016 | 413279 | `/hpHvGuMc46pppwpcW0Xk7eys3L4.jpg` |
| `guardians-of-the-galaxy-vol-2-2017` | Guardians of the Galaxy Vol. 2 | Guardians of the Galaxy Vol. 2 | 2017 | 283995 | `/y4MBh0EjBlMuOzv9axM4qJlmhzz.jpg` |
| `inhumans-2017` | Inhumans | Marvel's Inhumans | 2017 | 68716 | `/zKfGip55oJ9tdzhyd9ayGyFFhuo.jpg` |
| `iron-fist-2017` | Iron Fist | Marvel's Iron Fist | 2017 | 62127 | `/4l6KD9HhtD6nCDEfg10Lp6C6zah.jpg` |
| `justice-league-2017` | Justice League | Justice League | 2017 | 141052 | `/eifGNCSDuxJeS1loAXil5bIGgvC.jpg` |
| `legion-2017` | Legion | Legion | 2017 | 67195 | `/xhJtYVTsdXQCIlB5hAXkMCPUG9y.jpg` |
| `logan-2017` | Logan | Logan | 2017 | 263115 | `/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg` |
| `runaways-2017` | Runaways | Marvel's Runaways | 2017 | 67466 | `/hnHEhbzh0F7kN3Ah1lzRjtQuW16.jpg` |
| `spider-man-homecoming-2017` | Spider-Man: Homecoming | Spider-Man: Homecoming | 2017 | 315635 | `/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg` |
| `the-defenders-2017` | The Defenders | Marvel's The Defenders | 2017 | 62285 | `/49XzINhH4LFsgz7cx6TOPcHUJUL.jpg` |
| `the-gifted-2017` | The Gifted | The Gifted | 2017 | 69629 | `/nshCqszjTNuqhrB53vrSqWO18sE.jpg` |
| `the-punisher-2017` | The Punisher | Marvel's The Punisher | 2017 | 67178 | `/tM6xqRKXoloH9UchaJEyyRE9O1w.jpg` |
| `thor-ragnarok-2017` | Thor: Ragnarok | Thor: Ragnarok | 2017 | 284053 | `/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg` |
| `wonder-woman-2017` | Wonder Woman | Wonder Woman | 2017 | 297762 | `/v4ncgZjG2Zu8ZW5al1vIZTsSjqX.jpg` |
| `ant-man-and-the-wasp-2018` | Ant-Man and the Wasp | Ant-Man and the Wasp | 2018 | 363088 | `/cFQEO687n1K6umXbInzocxcnAQz.jpg` |
| `aquaman-2018` | Aquaman | Aquaman | 2018 | 297802 | `/ufl63EFcc5XpByEV2Ecdw6WJZAI.jpg` |
| `avengers-infinity-war-2018` | Avengers: Infinity War | Avengers: Infinity War | 2018 | 299536 | `/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg` |
| `black-lightning-2018` | Black Lightning | Black Lightning | 2018 | 71663 | `/h1xbvvO6oqchfLe6xh0yLNnQxeM.jpg` |
| `black-panther-2018` | Black Panther | Black Panther | 2018 | 284054 | `/uxzzxijgPIY7slzFvMotPv8wjKA.jpg` |
| `cloak-and-dagger-2018` | Cloak & Dagger | Marvel's Cloak & Dagger | 2018 | 66190 | `/pYnRJuBPEqZO1o4fcxBTgmKNHfy.jpg` |
| `deadpool-2-2018` | Deadpool 2 | Deadpool 2 | 2018 | 383498 | `/to0spRl1CMDvyUbOnbb4fTk3VAd.jpg` |
| `spider-man-into-the-spider-verse-2018` | Spider-Man: Into the Spider-Verse | Spider-Man: Into the Spider-Verse | 2018 | 324857 | `/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg` |
| `teen-titans-go-to-the-movies-2018` | Teen Titans Go! To the Movies | Teen Titans Go! To the Movies | 2018 | 474395 | `/mFHihhE9hlvJEk2f1AqdLRaYHd6.jpg` |
| `venom-2018` | Venom | Venom | 2018 | 335983 | `/2uNW4WbgBXL25BAbXGLnLqX71Sw.jpg` |
| `harley-quinn-2019` | Harley Quinn | Harley Quinn | 2019 | 74440 | `/9Dm1SEh8Wxt8LNNg02exHQ595zg.jpg` |
| `avengers-endgame-2019` | Avengers: Endgame | Avengers: Endgame | 2019 | 299534 | `/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg` |
| `batwoman-2019` | Batwoman | Batwoman | 2019 | 89247 | `/pBpxKiitMuYXvtsXNSzya8DKKzV.jpg` |
| `captain-marvel-2019` | Captain Marvel | Captain Marvel | 2019 | 299537 | `/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg` |
| `dark-phoenix-2019` | Dark Phoenix | Dark Phoenix | 2019 | 320288 | `/cCTJPelKGLhALq3r51A9uMonxKj.jpg` |
| `joker-2019` | Joker | Joker | 2019 | 475557 | `/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg` |
| `shazam-2019` | Shazam! | Shazam! | 2019 | 287947 | `/xnopI5Xtky18MPhK40cZAGAOVeV.jpg` |
| `spider-man-far-from-home-2019` | Spider-Man: Far From Home | Spider-Man: Far From Home | 2019 | 429617 | `/4q2NNj4S5dG2RLF9CpXsej7yXl.jpg` |
| `birds-of-prey-2020` | Birds of Prey | Birds of Prey (and the Fantabulous Emancipation of One Harley Quinn) | 2020 | 495764 | `/h4VB6m0RwcicVEZvzftYZyKXs6K.jpg` |
| `helstrom-2020` | Helstrom | Helstrom | 2020 | 88987 | `/5QmcKsepYpO9XYsWNLwsiULoaAu.jpg` |
| `the-new-mutants-2020` | The New Mutants | The New Mutants | 2020 | 340102 | `/xiDGcXJTvu1lazFRYip6g1eLt9c.jpg` |
| `wonder-woman-1984-2020` | Wonder Woman 1984 | Wonder Woman 1984 | 2020 | 464052 | `/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg` |
| `black-widow-2021` | Black Widow | Black Widow | 2021 | 497698 | `/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg` |
| `eternals-2021` | Eternals | Eternals | 2021 | 524434 | `/lFByFSLV5WDJEv3KabbdAF959F2.jpg` |
| `loki-seasons-1-2-2021` | Loki (Seasons 1-2) | Loki | 2021 | 84958 | `/kEl2t3OhXc3Zb9FBh1AuYzRTgZp.jpg` |
| `shang-chi-and-the-legend-of-the-ten-rings-2021` | Shang-Chi and the Legend of the Ten Rings | Shang-Chi and the Legend of the Ten Rings | 2021 | 566525 | `/9f2Q0U3IOsLgrI2HkvldwSABZy5.jpg` |
| `spider-man-no-way-home-2021` | Spider-Man: No Way Home | Spider-Man: No Way Home | 2021 | 634649 | `/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg` |
| `superman-and-lois-2021` | Superman & Lois | Superman & Lois | 2021 | 95057 | `/vlv1gn98GqMnKHLSh0dNciqGfBl.jpg` |
| `the-suicide-squad-2021` | The Suicide Squad | The Suicide Squad | 2021 | 436969 | `/q61qEyssk2ku3okWICKArlAdhBn.jpg` |
| `venom-let-there-be-carnage-2021` | Venom: Let There Be Carnage | Venom: Let There Be Carnage | 2021 | 580489 | `/pzKsRuKLFmYrW5Q0q8E8G78Tcgo.jpg` |
| `what-if-2021` | What If...? | What If...? | 2021 | 91363 | `/lztz5XBMG1x6Y5ubz7CxfPFsAcW.jpg` |
| `zack-snyder-s-justice-league-2021` | Zack Snyder's Justice League | Zack Snyder's Justice League | 2021 | 791373 | `/tnAuB8q5vv7Ax9UAEje5Xi4BXik.jpg` |
| `wandavision-2021` | WandaVision | WandaVision | 2021 | 85271 | `/ijWWwINc8h71NQ8j1LTJMFSj5wr.jpg` |
| `the-falcon-and-the-winter-soldier-2021` | The Falcon and the Winter Soldier | The Falcon and the Winter Soldier | 2021 | 88396 | `/6kbAMLteGO8yyewYau6bJ683sw7.jpg` |
| `hawkeye-2021` | Hawkeye | Hawkeye | 2021 | 88329 | `/ct5pNE5dDHryHLDnxyZPYcqO1sz.jpg` |
| `peacemaker-2022` | Peacemaker | Peacemaker | 2022 | 110492 | `/yb4F1Oocq8GfQt6iIuAgYEBokhG.jpg` |
| `black-adam-2022` | Black Adam | Black Adam | 2022 | 436270 | `/rCtreCr4xiYEWDQTebybolIh6Xe.jpg` |
| `black-panther-wakanda-forever-2022` | Black Panther: Wakanda Forever | Black Panther: Wakanda Forever | 2022 | 505642 | `/sv1xJUazXeYqALzczSZ3O6nkH75.jpg` |
| `doctor-strange-in-the-multiverse-of-madness-2022` | Doctor Strange in the Multiverse of Madness | Doctor Strange in the Multiverse of Madness | 2022 | 453395 | `/ddJcSKbcp4rKZTmuyWaMhuwcfMz.jpg` |
| `i-am-groot-2022` | I Am Groot | The Little Guy | 2022 | 1010819 | `/lPzcizL8PdS2U1q0rfhlVn00b9l.jpg` |
| `morbius-2022` | Morbius | Morbius | 2022 | 526896 | `/Av8Z2jZhEm1FLkFzMThzz9hndJF.jpg` |
| `the-batman-2022` | The Batman | The Batman | 2022 | 414906 | `/74xTEgt7R36Fpooo50r9T25onhq.jpg` |
| `thor-love-and-thunder-2022` | Thor: Love and Thunder | Thor: Love and Thunder | 2022 | 616037 | `/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg` |
| `moon-knight-2022` | Moon Knight | Moon Knight | 2022 | 92749 | `/9K3lbMf8TKvL9xGEbzi7TggWCNQ.jpg` |
| `ms-marvel-2022` | Ms. Marvel | Ms. Marvel | 2022 | 92782 | `/3HWWh92kZbD7odwJX7nKmXNZsYo.jpg` |
| `she-hulk-attorney-at-law-2022` | She-Hulk: Attorney at Law | She-Hulk: Attorney at Law | 2022 | 92783 | `/5xz2orV8f0usyrfGNshcoXHmiaV.jpg` |
| `werewolf-by-night-2022` | Werewolf by Night | Werewolf by Night | 2022 | 894205 | `/mvIvNKRIJPPS7WSFarFhOAGIVnU.jpg` |
| `the-guardians-of-the-galaxy-holiday-special-2022` | The Guardians of the Galaxy Holiday Special | The Guardians of the Galaxy Holiday Special | 2022 | 774752 | `/8dqXyslZ2hv49Oiob9UjlGSHSTR.jpg` |
| `ant-man-and-the-wasp-quantumania-2023` | Ant-Man and the Wasp: Quantumania | Ant-Man and the Wasp: Quantumania | 2023 | 640146 | `/qnqGbB22YJ7dSs4o6M7exTpNxPz.jpg` |
| `aquaman-and-the-lost-kingdom-2023` | Aquaman and the Lost Kingdom | Aquaman and the Lost Kingdom | 2023 | 572802 | `/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg` |
| `blue-beetle-2023` | Blue Beetle | Blue Beetle | 2023 | 565770 | `/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg` |
| `guardians-of-the-galaxy-vol-3-2023` | Guardians of the Galaxy Vol. 3 | Guardians of the Galaxy Vol. 3 | 2023 | 447365 | `/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg` |
| `shazam-fury-of-the-gods-2023` | Shazam! Fury of the Gods | Shazam! Fury of the Gods | 2023 | 594767 | `/3GrRgt6CiLIUXUtoktcv1g2iwT5.jpg` |
| `spider-man-across-the-spider-verse-2023` | Spider-Man: Across the Spider-Verse | Spider-Man: Across the Spider-Verse | 2023 | 569094 | `/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg` |
| `the-flash-2023` | The Flash | The Flash | 2023 | 298618 | `/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg` |
| `the-marvels-2023` | The Marvels | The Marvels | 2023 | 609681 | `/9GBhzXMFjgcZ3FdR9w3bUMMTps5.jpg` |
| `secret-invasion-2023` | Secret Invasion | Secret Invasion | 2023 | 114472 | `/3rINdUPSy9AklJg74jWHOyUXuZd.jpg` |
| `deadpool-and-wolverine-2024` | Deadpool & Wolverine | Deadpool & Wolverine | 2024 | 533535 | `/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg` |
| `joker-folie-a-deux-2024` | Joker: Folie à Deux | Joker: Folie à Deux | 2024 | 889737 | `/if8QiqCI7WAGImKcJCfzp6VTyKA.jpg` |
| `madame-web-2024` | Madame Web | Madame Web | 2024 | 634492 | `/rULWuutDcN5NvtiZi4FRPzRYWSh.jpg` |
| `the-penguin-2024` | The Penguin | The Penguin | 2024 | 194764 | `/vOWcqC4oDQws1doDWLO7d3dh5qc.jpg` |
| `venom-the-last-dance-2024` | Venom: The Last Dance | Venom: The Last Dance | 2024 | 912649 | `/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg` |
| `echo-2024` | Echo | Echo | 2024 | 122226 | `/vFyJH630cF68LohVYjQW49074Sy.jpg` |
| `x-men-97-2024` | X-Men '97 | X-Men '97 | 2024 | 138502 | `/2HKBc5UiFw8JrruHq8S1Y7TnlW0.jpg` |
| `agatha-all-along-2024` | Agatha All Along | Agatha All Along | 2024 | 138501 | `/mGsxKwXUjojitRv2E9qMTbxbBRd.jpg` |
| `creature-commandos-2024` | Creature Commandos | Creature Commandos | 2024 | 219543 | `/bB3G6Ug1jfsOUptb0RJsqrgMVta.jpg` |
| `kraven-the-hunter-2024` | Kraven the Hunter | Kraven the Hunter | 2024 | 539972 | `/1GvBhRxY6MELDfxFrete6BNhBB5.jpg` |
| `your-friendly-neighborhood-spider-man-2025` | Your Friendly Neighborhood Spider-Man | Your Friendly Neighborhood Spider-Man | 2025 | 138503 | `/kjcsNeqF52YUQ2rUBGLMHwLkxvR.jpg` |
| `captain-america-brave-new-world-2025` | Captain America: Brave New World | Captain America: Brave New World | 2025 | 822119 | `/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg` |
| `daredevil-born-again-2025` | Daredevil: Born Again | Daredevil: Born Again | 2025 | 202555 | `/xDUoAsU8lQHOOoRkFiBuarmACDN.jpg` |
| `thunderbolts-2025` | Thunderbolts* | Thunderbolts* | 2025 | 986056 | `/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg` |
| `ironheart-2025` | Ironheart | Ironheart | 2025 | 114471 | `/dOh6MJpdlQhYpLBhzhNQeYGKTZ5.jpg` |
| `superman-2025` | Superman | Superman | 2025 | 1061474 | `/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg` |
| `the-fantastic-four-first-steps-2025` | The Fantastic Four: First Steps | The Fantastic 4: First Steps | 2025 | 617126 | `/nf5qaSEvyYSNeFH0YhSs5EsBLX9.jpg` |
| `eyes-of-wakanda-2025` | Eyes of Wakanda | Eyes of Wakanda | 2025 | 241388 | `/yuOfb1MgnaGPa4guzV0n1IFYVGN.jpg` |
| `marvel-zombies-2025` | Marvel Zombies | Marvel Zombies | 2025 | 138505 | `/mwKj9ERGFXsWot0nXgQ5yMQf9I7.jpg` |
| `wonder-man-2025` | Wonder Man | Wonder Man | 2026 | 198178 | `/6yy9nQlFt2l6UVWzrfhszFCaZ5C.jpg` |
| `vision-quest-2026` | Vision Quest | VisionQuest | 2026 | 213375 | `/kSLKCUUsYXjXomMIPEFGcNbeByV.jpg` |
| `supergirl-2026` | Supergirl | Supergirl | 2026 | 1081003 | `/uhzRnTW4DM13UQBvZP3eVNzQTuz.jpg` |
| `spider-man-brand-new-day-2026` | Spider-Man: Brand New Day | Spider-Man: Brand New Day | 2026 | 969681 | `/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg` |
| `clayface-2026` | Clayface | Clayface | 2026 | 1400940 | `/5jCpQnWPikggmQZoDp1eAi6BI6w.jpg` |
| `avengers-doomsday-2026` | Avengers: Doomsday | Avengers: Doomsday | 2026 | 1003596 | `/jzPwsojjFStf5lR5Nm07w2hH56G.jpg` |
| `man-of-tomorrow-2027` | Man of Tomorrow | Man of Tomorrow | 2027 | 1523140 | `/tYLgfKk3cEk7LskgxWyW37Nty01.jpg` |
| `the-batman-part-ii-2027` | The Batman Part II | The Batman: Part II | 2028 | 806704 | `/r5fl4aMsmTjgc8DdDqQaM84roWp.jpg` |
| `avengers-secret-wars-2027` | Avengers: Secret Wars | Avengers: Secret Wars | 2027 | 1003598 | `/f0YBuh4hyiAheXhh4JnJWoKi9g5.jpg` |
| `blade-tbd` | Blade | Blade | 1998 | 36647 | `/oWT70TvbsmQaqyphCZpsnQR7R32.jpg` |
| `lanterns-tbd` | Lanterns | Lanterns | 2026 | 95350 | `/sbBehMLO6Ge7Tbk374dIBtUjO6P.jpg` |
| `shang-chi-2-tbd` | Shang-Chi 2 | Untitled Shang-Chi and the Legend of the Ten Rings Sequel | TBD | 1737233 | `/eg37SyXwgF7xlo89C97SWJ3ue9f.jpg` |
| `spider-man-beyond-the-spider-verse-tbd` | Spider-Man: Beyond the Spider-Verse | Spider-Man: Beyond the Spider-Verse | 2027 | 911916 | `/9KAe39xqyZnv9J4W3DRGdQqX82h.jpg` |
| `swamp-thing-dcu-tbd` | Swamp Thing (DCU) | Swamp Thing | 1982 | 17918 | `/7BGaE9A7UeyxH29aeFbQfzEmIi0.jpg` |
| `the-authority-tbd` | The Authority | Man-Slashing Horse-Piercing Sword | 1929 | 467025 | `/ayn3CXn5wSbZS8b8uuzBJ3R8Ddq.jpg` |

