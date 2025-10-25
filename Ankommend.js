javascript:

//scav overview by Sophie "Shinko to Kuma" - Optimized for Quickbar

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass`;
} else {
    URLReq = "game.php?&screen=place&mode=scavenge_mass";
}
var scavengeInfo = [];
var categoryNames;
var html = "";
var minReturnTime = Number.MAX_SAFE_INTEGER;
var minVillageId;
var villageNameMap = {};

// NEU: Funktionen zur Zeitformatierung und Tab-Titel-Steuerung (KOMPRIMIERT)
function fT(t) {
    if (t <= 0) return "00:00:00";
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const p = (n) => n.toString().padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}`;
}
let tTI, oT = document.title, sRTS = 0;
function uTTT() {
    if (sRTS > 0) {
        sRTS--;
        document.title = `(${fT(sRTS)}) ${villageNameMap[minVillageId]||'Scavenge'} | DS`;
    } else {
        clearInterval(tTI);
        document.title = `[FERTIG] ${oT}`;
        setTimeout(() => { document.title = oT; }, 5000);
    }
}
window.onbeforeunload = function() { clearInterval(tTI); document.title = oT; };


//classes CSS
cssClassesSophie = `
  <style>
  .sophRowA {
  background-color: #32353b;
  color: white;
  padding:5px;
  }
  .sophRowB {
  background-color: #36393f;
  color: white;
  padding:5px;
  }
  .sophHeader {
  background-color: #202225;
  font-weight: bold;
  color: white;
  padding:5px;
  }
  </style>`
$(".content-border").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);


$.getAll = function (
    urls, // array of URLs
    onLoad, // called when any URL is loaded, params (index, data)
    onDone, // called when all URLs successfully loaded, no params
    onError // called when a URL load fails or if onLoad throws an exception, params (error)
) {
    var numDone = 0;
    var lastRequestTime = 0;
    var minWaitTime = 200; // ms between requests
    loadNext();
    function loadNext() {
        if (numDone == urls.length) {
            onDone();
            return;
        }

        let now = Date.now();
        let timeElapsed = now - lastRequestTime;
        if (timeElapsed < minWaitTime) {
            let timeRemaining = minWaitTime - timeElapsed;
            setTimeout(loadNext, timeRemaining);
            return;
        }
        //console.log('Getting ', urls[numDone]);
        $("#progress").css("width", `${(numDone + 1) / urls.length * 100}%`);
        lastRequestTime = now;
        $.get(urls[numDone])
            .done((data) => {
                try {
                    onLoad(numDone, data);
                    ++numDone;
                    loadNext();
                } catch (e) {
                    onError(e);
                }
            })
            .fail((xhr) => {
                onError(xhr);
            })
    }
};

URLs = [];
$.get(URLReq, function (data) {
    if ($(data).find(".paged-nav-item").length > 0) {
        amountOfPages = parseInt($(data).find(".paged-nav-item")[$(data).find(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]);
    }
    else {
        amountOfPages = 0;
    }
    //console.log("Amount of pages: " + amountOfPages);
    categoryNames = JSON.parse("[" + $(data).find('script:contains("ScavengeMassScreen")')[0].innerHTML.match(/\{.*\:\{.*\:.*\}\}/g) + "]")[0];
    for (var i = 0; i <= amountOfPages; i++) {
        //push url that belongs to scavenging page i
        URLs.push(URLReq + "&page=" + i);
        //get world data
        tempData = JSON.parse($(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[0]);
        duration_exponent = tempData[1].duration_exponent;
        duration_factor = tempData[1].duration_factor;
        duration_initial_seconds = tempData[1].duration_initial_seconds;
    }
    //console.log(URLs);

})
    .done(function () {
        html = "<div><table class='sophHeader'><tr class='sophHeader'><td class='sophHeader'colspan='5'><h1><center>Mass scavenging overview</center></h1></td></tr><tr class='sophHeader'><td class='sophHeader'>Village</td><td class='sophHeader'>" + categoryNames[1].name + "</td><td class='sophHeader'>" + categoryNames[2].name + "</td><td class='sophHeader'>" + categoryNames[3].name + "</td><td class='sophHeader'>" + categoryNames[4].name + "</td></tr>";
        //here we get all the village data and make an array with it, we won't be able to parse unless we add brackets before and after the string
        arrayWithData = "[";
        $.getAll(URLs,
            (i, here) => {
                thisPageData = $(here).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[2];
                arrayWithData += thisPageData + ",";
            },
            () => {
                //on done
                arrayWithData = arrayWithData.substring(0, arrayWithData.length - 1);
                //closing bracket so we can parse the data into a useable array
                arrayWithData += "]";
                scavengeInfo = JSON.parse(arrayWithData);
                
                let minRTS = Number.MAX_SAFE_INTEGER; // NEU: Lokale Variable für die kürzeste Rückkehrzeit

                //get all the data in a table
                $.each(scavengeInfo, function (villageNr) {
                    if (villageNr % 2 == 0) {
                        rowClass = 'class="sophRowA"'
                    }
                    else {
                        rowClass = 'class="sophRowB"'
                    }

                    villageNameMap[scavengeInfo[villageNr].village_id] = scavengeInfo[villageNr].village_name;
                    html += `<tr ${rowClass}><td class="sophHeader">${scavengeInfo[villageNr].village_name}</td>`;
                    $.each(scavengeInfo[villageNr]["options"], function (villageCategoryNr) {
                        if (scavengeInfo[villageNr]["options"][villageCategoryNr]["scavenging_squad"] != null) {
                            // Endzeit der Plünderung in Millisekunden
                            endTime = parseInt(scavengeInfo[villageNr]["options"][villageCategoryNr]["scavenging_squad"]["return_time"]) * 1000; 
                            html += `<td ${rowClass}><span class="timer" data-endtime=${parseInt(endTime / 1000)}></span></td>`;
                            
                            // Nur die Endzeit in Sekunden speichern, um minRTS zu bestimmen
                            const returnTimeSeconds = parseInt(scavengeInfo[villageNr]["options"][villageCategoryNr]["scavenging_squad"]["return_time"]);
                            if (minRTS > returnTimeSeconds) {
                              minRTS = returnTimeSeconds;
                              minVillageId = parseInt(scavengeInfo[villageNr]["options"][villageCategoryNr]["village_id"]);
                            }
                        }
                        else {
                            if (scavengeInfo[villageNr]["options"][villageCategoryNr]["is_locked"] != true) {
                                html += `<td ${rowClass}>No run</td>`;
                                // Setze minRTS auf 0, wenn ein Dorf bereit ist und es noch keinen besseren (0) Wert gab
                                if (minRTS > 0) {
                                    minRTS = 0;
                                    minVillageId = parseInt(scavengeInfo[villageNr]["options"][villageCategoryNr]["village_id"]);
                                }
                            }
                            else
                            {
                                html += `<td ${rowClass}>LOCKED</td>`
                            }
                        }
                    })
                    html += "</tr>";
                })
                
                // NEU: Berechne verbleibende Sekunden und starte den Tab-Titel-Timer
                if (minRTS != Number.MAX_SAFE_INTEGER) {
                    // Verbleibende Zeit (jetzt in Sekunden)
                    sRTS = Math.max(0, minRTS - Math.floor(Date.now() / 1000)); 
                }
                
                // minReturnTime für die Anzeige im HTML neu setzen
                minReturnTime = sRTS * 1000;
                
                html += `<tr class='sophHeader'><td class='sophHeader'colspan='5'><h1>Closest scavenge to end: <a href='${location.origin + `/game.php?village=${minVillageId}&screen=place&mode=scavenge`}' target="_blank">${villageNameMap[minVillageId]}</a> Duration Remaining: ${minReturnTime ? `<span class="timer" data-endtime=${parseInt(minReturnTime / 1000)}></span>` : 'No run'}</h1></td></tr></table></div>`
                $("#contentContainer").eq(0).prepend(html);
                $("#mobileContent").eq(0).prepend(html);
                Timing.tickHandlers.timers.init();
                
                // Starte den Tab-Titel-Timer
                if (sRTS >= 0) {
                    uTTT(); // Erste Aktualisierung sofort
                    tTI = setInterval(uTTT, 1000);
                }
            },
            (error) => {
                console.error(error);
            });
    }
    )
