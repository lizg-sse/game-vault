/**
 * Hand-written clue packs for Six Clues.
 *
 * The order is part of the design. Each pack is consumed exactly as written:
 * a good first clue for one player can be a terrible first clue for another.
 */
export type HintRule =
  | "target"
  | "same-decade"
  | "same-position"
  | "same-height-band"
  | "same-tenure"
  | "same-scoring-band"
  | "same-school"
  | "same-country"
  | "same-draft-round"
  | "same-honors"
  | "same-title-status"
  | "same-defense";

export type AuthoredHint = {
  key: string;
  text: string;
  /** Internal candidate matching; this is not a display category. */
  rule: HintRule;
};

const h = (
  key: string,
  text: string,
  rule: HintRule = "target",
): AuthoredHint => ({
  key,
  text,
  rule,
});

export const HINTS: Record<number, readonly AuthoredHint[]> = {
  2225: [
    // Tony Parker
    h("album", "Released a French hip-hop album in 2007."),
    h(
      "finals-mvp",
      "First international player to win the NBA Finals MVP award",
    ),
    h("tenure", "Spent 17 seasons in San Antonio.", "same-tenure"),
    h(
      "college",
      "Played for Paris Basket Racing before being drafted by the Spurs.",
    ),
    h("role", "Appeared as a judge on the French version of Shark Tank."),
    h("titles", "Won four titles with the Spurs."),
  ],
  1495: [
    // Tim Duncan
    h("draft-slot", "Drafted in 1997."),
    h("mvp", "Won two regular-season MVP awards."),
    h("all-star", "Made 15 All-Star teams."),
    h("college", "Played all four years of college at Wake Forest."),
    h("titles", "Won five titles with San Antonio."),
    h("tenure", "Spent 19 seasons with San Antonio.", "same-tenure"),
  ],
  999999: [
    // Coyote
    h("ejected", "Famously ejected from a game for mocking behavior"),
    h(
      "all-star-weekend",
      "Brought home a trophy from the 2012 All-Star weekend",
    ),
    h(
      "iron-man",
      "Logged an iron-man streak of over 1,000 consecutive San Antonio home game appearances",
    ),
    h("hall-of-fame", "Hall of Fame inductee and multiple time MVV winner"),
    h("dunkology", "Holds an honorary degree in 'Dunkology'"),
    h("nickname", "Wears number 2!"),
  ],
  // 1498: [
  //   // Antonio Daniels
  //   h("championship", "Won a championship as a Spur in 1999."),
  //   h("draft-slot", "Picked fourth overall in 1997."),
  //   h("college", "Played at Bowling Green.", "same-school"),
  //   h("tenure", "Four seasons in San Antonio.", "same-tenure"),
  //   h("role", "A guard.", "same-position"),
  //   h(
  //     "height-band",
  //     "Listed between 6′3″ and 6′6″.",
  //     "same-height-band",
  //   ),
  // ],
  // 686: [ // Antonio McDyess
  //   h("all-star", "Made one All-Star team before joining the Spurs."),
  //   h("height", "Listed at 6′9″."),
  //   h("draft-slot", "Picked second overall in 1995."),
  //   h("tenure", "Two seasons in San Antonio.", "same-tenure"),
  //   h("college", "Played at Alabama.", "same-school"),
  //   h(
  //     "numbers",
  //     "Averaged 5.6 points and 5.7 rebounds with the Spurs.",
  //   ),
  // ],
  422: [
    // Avery Johnson
    h("nickname", "Known as “The Little General.”"),
    h("finals-shot", "Closed out the 1999 Finals with an 18-foot jumper."),
    h("tenure", "Spent 10 seasons with San Antonio.", "same-tenure"),
    h("college", "Played at Southern University.", "same-school"),
    h("build", "A 5′11″ guard."),
    h("draft", "Went undrafted."),
  ],
  // 2757: [ // Beno Udrih
  //   h("titles", "Won titles with the Spurs in 2005 and 2007."),
  //   h("draft-slot", "Picked 28th overall in 2004."),
  //   h("route", "Played for Olimpia Milano."),
  //   h("build", "A 6′3″ guard."),
  //   h(
  //     "tenure",
  //     "Spent three seasons in San Antonio.",
  //     "same-tenure",
  //   ),
  //   h("country", "A Slovenian guard."),
  // ],
  2564: [
    // Boris Diaw
    h(
      "coffee-locker",
      "Had a fully functioning espresso machine installed inside his locker and took it on the road.",
    ),
    h("coffee-list", "Kept a list of coffee shops to visit on the road."),
    h("title", "Won the 2014 championship with San Antonio."),
    h("build", "A 6′8″ center-forward."),
    h("route", "Played in France before coming to the NBA."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
  ],
  699: [
    // Brent Barry
    h("dunk-contest", "Won the 1996 Slam Dunk Contest."),
    h("family", "His father was Hall of Famer Rick Barry."),
    h("three-point", "Led the NBA in three-point percentage in 2000–01."),
    h("titles", "Won two titles with the Spurs."),
    h("college", "Played at Oregon State.", "same-school"),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
  ],
  1477: [
    // Bruce Bowen
    h("defense", "Made eight All-Defensive teams."),
    h("champions", "Started on the 2003, 2005 and 2007 championship teams."),
    h("path", "Went undrafted out of Cal State Fullerton."),
    h("tenure", "Spent eight seasons in San Antonio.", "same-tenure"),
    h("role", "A forward.", "same-position"),
    h("height-band", "Listed between 6′7″ and 6′9″.", "same-height-band"),
  ],
  // 1627854: [ // Bryn Forbes
  //   h("path", "Went undrafted out of Michigan State."),
  //   h("role", "A guard.", "same-position"),
  //   h("build", "A 6′2″ guard."),
  //   h(
  //     "tenure",
  //     "Spent five seasons in San Antonio.",
  //     "same-tenure",
  //   ),
  //   h("games", "Played 301 games for the Spurs."),
  //   h("scoring", "Averaged 8.9 points in San Antonio."),
  // ],
  101108: [
    // Chris Paul
    h("all-star", "A 12-time All-Star."),
    h("college", "Played at Wake Forest.", "same-school"),
    h("draft-slot", "Picked fourth overall by the Hornets in 2005."),
    h("tenure", "Spent one season with San Antonio.", "same-tenure"),
    h("build", "Listed at 6′0″."),
    h("all-nba", "Rookie of the Year, and one vote shy of unanimous."),
  ],
  // 202709: [ // Cory Joseph
  //   h("title", "Won the 2014 championship with San Antonio."),
  //   h("country", "A Canadian guard."),
  //   h("draft-slot", "Picked 29th overall in 2011."),
  //   h("college", "Played at Texas.", "same-school"),
  //   h(
  //     "tenure",
  //     "Spent four seasons in San Antonio.",
  //     "same-tenure",
  //   ),
  //   h("scoring", "Averaged 5.2 points with the Spurs."),
  // ],
  // 198: [ // Danny Ferry
  //   h("title", "Won the 2003 championship with San Antonio."),
  //   h("draft-slot", "Picked second overall in 1989."),
  //   h("height", "Listed at 6′10″."),
  //   h("college", "Played at Duke.", "same-school"),
  //   h(
  //     "tenure",
  //     "Spent three seasons in San Antonio.",
  //     "same-tenure",
  //   ),
  //   h("scoring", "Averaged 4.1 points with the Spurs."),
  // ],
  201980: [
    // Danny Green
    h("champ", "3 time NBA Champion."),
    h(
      "finals-record",
      "Made 27 three-pointers against Miami in the 2013 NBA Finals, an NBA record at the time.",
    ),
    h("college", "Played four years at North Carolina.", "same-school"),
    h("title", "Won the 2014 championship with San Antonio."),
    h("draft-slot", "Picked 46th overall in 2009."),
    h("tenure", "Spent eight seasons in San Antonio.", "same-tenure"),
  ],
  764: [
    // David Robinson
    h(
      "quadruple-double",
      "Recorded a quadruple-double: 34 points, 10 rebounds, 10 assists and 10 blocks.",
    ),
    h("scoring-title", "Won the 1993–94 NBA scoring title."),
    h("all-star", "A 10-time All-Star."),
    h("titles", "Won titles with the Spurs in 1999 and 2003."),
    h("draft-slot", "Went first overall in 1987."),
    h("college", "Played at Navy.", "same-school"),
  ],
  202722: [
    // Dāvis Bertāns
    h("country", "A Latvian forward."),
    h("draft-slot", "Picked 42nd overall in 2011."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("build", "Listed at 6′10″."),
    h("route", "Played for Baskonia."),
    h("scoring", "Averaged 6.2 points with the Spurs."),
  ],
  1628368: [
    // De'Aaron Fox
    h("draft-slot", "Picked fifth overall in 2017."),
    h("all-star", "A two-time All-Star."),
    h("college", "Played at Kentucky.", "same-school"),
    h("build", "A 6′3″ guard."),
    h("tenure", "Spent two seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 18.8 points with the Spurs."),
  ],
  1627749: [
    // Dejounte Murray
    h(
      "franchise-record",
      "Set the Spurs franchise single-season triple-double record with 13 in 2021–22.",
    ),
    h(
      "all-around",
      "Became the first player in NBA history to average 20 points, 8 rebounds, 9 assists and 2 steals in one season.",
    ),
    h("steals", "Led the NBA in steals per game in 2021–22."),
    h("draft-slot", "Picked 29th overall in 2016."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("college", "Played at Washington State.", "same-school"),
  ],
  201971: [
    // DeJuan Blair
    h("draft-slot", "Picked 37th overall in 2009."),
    h("college", "Played at Pittsburgh.", "same-school"),
    h("build", "Listed at 6′7″."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 7.8 points and 5.8 rebounds with the Spurs."),
    h("games", "Played 288 games for San Antonio."),
  ],
  201942: [
    // DeMar DeRozan
    h("all-star", "A six-time All-Star."),
    h("college", "Played at USC.", "same-school"),
    h("draft-slot", "Picked ninth overall in 2009."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 21.6 points with the Spurs."),
    h("role", "A guard-forward.", "same-position"),
  ],
  1507: [
    // Derek Anderson
    h("college", "Played at Kentucky.", "same-school"),
    h("draft-slot", "Picked 13th overall in 1997."),
    h("tenure", "Spent one season in San Antonio.", "same-tenure"),
    h("build", "A 6′5″ guard."),
    h("scoring", "Averaged 15.5 points with the Spurs."),
    h("games", "Played all 82 games as a Spur."),
  ],
  1628401: [
    // Derrick White
    h("college", "Played at Colorado.", "same-school"),
    h("draft-slot", "Picked 29th overall in 2017."),
    h("defense", "Made three All-Defensive teams."),
    h("build", "A 6′4″ guard."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 11.6 points with the Spurs."),
  ],
  1630170: [
    // Devin Vassell
    h("build", "A 6′5″ guard-forward."),
    h("draft-slot", "Picked 11th overall in 2020."),
    h("college", "Played at Florida State.", "same-school"),
    h("tenure", "Spent six seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 14.1 points with the Spurs."),
    h("games", "Played 370 games for San Antonio."),
  ],
  203926: [
    // Doug McDermott
    h("college", "Played at Creighton.", "same-school"),
    h("draft-slot", "Picked 11th overall in 2014."),
    h("build", "A 6′7″ forward."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 9.4 points with the Spurs."),
    h("games", "Played 161 games for the Spurs."),
  ],
  1642844: [
    // Dylan Harper
    h("draft-slot", "Picked second overall in 2025."),
    h("college", "Played at Rutgers.", "same-school"),
    h("build", "A 6′5″ guard."),
    h("tenure", "Has one season with San Antonio.", "same-tenure"),
    h("games", "Played 69 games for the Spurs."),
    h("scoring", "Averaged 11.8 points in San Antonio."),
  ],
  101177: [
    // Fabricio Oberto
    h("title", "Won the 2007 championship with San Antonio."),
    h("country", "An Argentine center."),
    h("route", "Played for Valencia."),
    h("draft", "Went undrafted."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 3.6 points with the Spurs."),
  ],
  202390: [
    // Gary Neal
    h("path", "Went undrafted out of Towson."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′4″ guard."),
    h("scoring", "Averaged 9.7 points with San Antonio."),
    h("games", "Played 204 games for the Spurs."),
    h("college", "Played at Towson.", "same-school"),
  ],
  76804: [
    // George Gervin
    h("nickname", "Known as “The Iceman.”"),
    h("scoring-titles", "Won four NBA scoring titles."),
    h("signature-shot", "Made the finger roll his signature shot."),
    h("all-star", "A 12-time All-Star."),
    h("draft", "Picked 40th overall in 1974."),
    h("tenure", "Spent 12 seasons in San Antonio.", "same-tenure"),
  ],
  201588: [
    // George Hill
    h(
      "trade",
      "Was traded to Indiana for the rights to Kawhi Leonard, Dāvis Bertāns and Erazem Lorbek.",
    ),
    h("college", "Played at IUPUI."),
    h("draft-slot", "Picked 26th overall in 2008."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′4″ guard."),
    h("games", "Played 231 games for the Spurs."),
  ],
  203084: [
    // Harrison Barnes
    h("draft-slot", "Picked seventh overall in 2012."),
    h("college", "Played at North Carolina.", "same-school"),
    h("build", "A 6′7″ forward."),
    h("tenure", "Has two seasons with San Antonio.", "same-tenure"),
    h("games", "Played 159 games for the Spurs."),
    h("scoring", "Averaged 11.2 points in San Antonio."),
  ],
  1627751: [
    // Jakob Poeltl
    h("build", "A seven-foot center."),
    h("draft-slot", "Picked ninth overall in 2016."),
    h("country", "An Austrian center."),
    h("college", "Played at Utah.", "same-school"),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("rebounding", "Averaged 7.3 rebounds with the Spurs."),
  ],
  203613: [
    // Jonathon Simmons
    h(
      "tryout",
      "Paid $150 for the D-League tryout that started his route to the NBA.",
    ),
    h("austin", "Played for the Austin Toros before signing with the Spurs."),
    h("college", "Played at Houston.", "same-school"),
    h("draft", "Went undrafted in 2012."),
    h("tenure", "Spent two seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′6″ forward."),
  ],
  1630577: [
    // Julian Champagnie
    h("draft", "Went undrafted out of St. John’s."),
    h("build", "A 6′7″ forward."),
    h("tenure", "Has four seasons with San Antonio.", "same-tenure"),
    h("games", "Played 253 games for the Spurs."),
    h("scoring", "Averaged 9.5 points in San Antonio."),
    h("college", "Played at St. John’s.", "same-school"),
  ],
  1628966: [
    // Keita Bates-Diop
    h("draft-slot", "Picked 48th overall in 2018."),
    h("college", "Played at Ohio State.", "same-school"),
    h("build", "A 6′8″ forward."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("games", "Played 156 games for the Spurs."),
    h("scoring", "Averaged 6.8 points in San Antonio."),
  ],
  1629640: [
    // Keldon Johnson
    h("role", "A 6′6″ forward-guard."),
    h("draft-slot", "Picked 29th overall in 2019."),
    h("college", "Played at Kentucky.", "same-school"),
    h("tenure", "Has seven seasons with San Antonio.", "same-tenure"),
    h("games", "Played 452 games for the Spurs."),
    h("scoring", "Averaged 15.1 points in San Antonio."),
  ],
  203937: [
    // Kyle Anderson
    h("build", "A 6′8″ forward-guard."),
    h("college", "Played at UCLA.", "same-school"),
    h("draft-slot", "Picked 30th overall in 2014."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("games", "Played 257 games for the Spurs."),
    h("scoring", "Averaged 4.9 points with San Antonio."),
  ],
  200746: [
    // LaMarcus Aldridge
    h("build", "Listed at 6′11″."),
    h("all-star", "A seven-time All-Star."),
    h("all-nba", "Made five All-NBA teams."),
    h("college", "Played at Texas.", "same-school"),
    h("draft-slot", "Picked second overall in 2006."),
    h("tenure", "Spent six seasons in San Antonio.", "same-tenure"),
  ],
  1629022: [
    // Lonnie Walker IV
    h("build", "A 6′4″ guard-forward."),
    h("draft-slot", "Picked 18th overall in 2018."),
    h("college", "Played at Miami.", "same-school"),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("games", "Played 208 games for the Spurs."),
    h("scoring", "Averaged 9.4 points with San Antonio."),
  ],
  1631103: [
    // Malaki Branham
    h("draft-slot", "Picked 20th overall in 2022."),
    h("college", "Played at Ohio State.", "same-school"),
    h("build", "A 6′4″ forward."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("games", "Played 188 games for the Spurs."),
    h("scoring", "Averaged 8.5 points in San Antonio."),
  ],
  990: [
    // Malik Rose
    h("titles", "Won titles with San Antonio in 1999 and 2003."),
    h("draft-slot", "Picked 44th overall in 1996."),
    h("college", "Played at Drexel.", "same-school"),
    h("build", "A 6′7″ forward."),
    h("games", "Played 509 games for the Spurs."),
    h("rebounding", "Averaged 4.8 rebounds in San Antonio."),
  ],
  1938: [
    // Manu Ginobili
    h("country", "An Argentine left-handed guard."),
    h("draft-slot", "Picked 57th overall in 1999."),
    h("titles", "Won four championships with the Spurs."),
    h("tenure", "Spent 16 seasons in San Antonio.", "same-tenure"),
    h("all-star", "Made two All-Star teams."),
    h(
      "bat",
      "Swatted a live bat out of the air with his bare hand during a 2009 game.",
    ),
  ],
  201158: [
    // Marco Belinelli
    h("three-point-contest", "Won the 2014 Three-Point Contest."),
    h("country", "An Italian guard."),
    h("draft-slot", "Picked 18th overall in 2007."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("title", "Won the 2014 title with the Spurs."),
    h("build", "A 6′5″ guard."),
  ],
  53: [
    // Mario Elie
    h("kiss-of-death", "Hit the “Kiss of Death” shot in the 1995 playoffs."),
    h("title", "Won the 1999 championship with San Antonio."),
    h("build", "A 6′5″ guard-forward."),
    h("draft", "Picked 160th overall in 1985."),
    h("college", "Played at American International.", "same-school"),
    h("tenure", "Spent two seasons in San Antonio.", "same-tenure"),
  ],
  2588: [
    // Matt Bonner
    h(
      "sandwich-blog",
      "Kept a blog dedicated to finding the best artisanal sandwiches in NBA cities.",
    ),
    h("nickname", "Known as “Red Mamba.”"),
    h("build", "Listed at 6′10″."),
    h("tenure", "Spent 10 seasons in San Antonio.", "same-tenure"),
    h("titles", "Won titles with the Spurs in 2007 and 2014."),
    h("draft-slot", "Picked 45th overall in 2003."),
  ],
  714: [
    // Michael Finley
    h("all-star", "A two-time All-Star."),
    h("title", "Won the 2007 championship with San Antonio."),
    h("college", "Played at Wisconsin.", "same-school"),
    h("draft-slot", "Picked 21st overall in 1995."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("scoring", "Averaged 9.3 points with the Spurs."),
  ],
  1737: [
    // Nazr Mohammed
    h("title", "Won the 2005 championship with San Antonio."),
    h("college", "Played at Kentucky.", "same-school"),
    h("draft-slot", "Picked 29th overall in 1998."),
    h("build", "A 6′10″ center."),
    h("tenure", "Spent two seasons in San Antonio.", "same-tenure"),
    h("games", "Played 103 games for the Spurs."),
  ],
  201988: [
    // Patty Mills
    h("title", "Won the 2014 championship with San Antonio."),
    h("country", "An Australian guard."),
    h("draft-slot", "Picked 55th overall in 2009."),
    h("college", "Played at Saint Mary’s.", "same-school"),
    h("tenure", "Spent 10 seasons in San Antonio.", "same-tenure"),
    h("games", "Played 665 games for the Spurs."),
  ],
  2200: [
    // Pau Gasol
    h("all-star", "A six-time All-Star."),
    h("all-nba", "Made four All-NBA teams."),
    h("build", "A seven-foot center-forward."),
    h("college", "Played for FC Barcelona."),
    h("draft-slot", "Picked third overall in 2001."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
  ],
  1725: [
    // Rasho Nesterovic
    h("country", "A Slovenian center."),
    h("draft-slot", "Picked 17th overall in 1998."),
    h("route", "Played for Virtus Bologna."),
    h("build", "A seven-footer."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("games", "Played 232 games for the Spurs."),
  ],
  2210: [
    // Richard Jefferson
    h("title", "Won the 2016 championship with Cleveland."),
    h("build", "A 6′7″ forward."),
    h("college", "Played at Arizona.", "same-school"),
    h("draft-slot", "Picked 13th overall in 2001."),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("games", "Played 203 games for the Spurs."),
  ],
  109: [
    // Robert Horry
    h("nickname", "Known as “Big Shot Rob.”"),
    h("rings", "Won seven NBA titles."),
    h("college", "Played at Alabama.", "same-school"),
    h("draft-slot", "Picked 11th overall in 1992."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′10″ forward-center."),
  ],
  200752: [
    // Rudy Gay
    h("build", "A 6′8″ forward-guard."),
    h("college", "Played at Connecticut.", "same-school"),
    h("draft-slot", "Picked eighth overall in 2006."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("games", "Played 256 games for the Spurs."),
    h("scoring", "Averaged 11.9 points with San Antonio."),
  ],
  251: [
    // Sean Elliott
    h("build", "A 6′8″ forward."),
    h("college", "Played at Arizona.", "same-school"),
    h("all-star", "A two-time All-Star."),
    h("title", "Won the 1999 championship with San Antonio."),
    h("draft-slot", "Picked third overall in 1989."),
    h(
      "memorial-day",
      "Hit the “Memorial Day Miracle” in the 1999 Western Conference finals.",
    ),
  ],
  1536: [
    // Stephen Jackson
    h("championship", "Won the 2003 championship with San Antonio."),
    h("nickname", "Known as “Captain Jack.”"),
    h("draft-slot", "Picked 42nd overall in 1997."),
    h("college", "Played at Butler Community College."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′8″ guard-forward."),
  ],
  1642264: [
    // Stephon Castle
    h("college-title", "Won the 2024 NCAA title at UConn."),
    h("draft-slot", "Picked fourth overall in 2024."),
    h("build", "A 6′6″ guard."),
    h("college", "Played at Connecticut.", "same-school"),
    h("tenure", "Has two seasons with San Antonio.", "same-tenure"),
    h("games", "Played 149 games for the Spurs."),
  ],
  70: [
    // Steve Kerr
    h("title", "Won titles with San Antonio in 1999 and 2003."),
    h("draft-slot", "Picked 50th overall in 1988."),
    h("college", "Played at Arizona.", "same-school"),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′1″ guard."),
    h("scoring", "Averaged 3.7 points with the Spurs."),
  ],
  345: [
    // Terry Porter
    h("all-star", "A two-time All-Star."),
    h("draft-slot", "Picked 24th overall in 1985."),
    h("college", "Played at Wisconsin–Stevens Point.", "same-school"),
    h("tenure", "Spent three seasons in San Antonio.", "same-tenure"),
    h("build", "A 6′3″ guard."),
    h("playmaking", "Averaged 3.1 assists with the Spurs."),
  ],
  201168: [
    // Tiago Splitter
    h("country", "A Brazilian center."),
    h("draft-slot", "Picked 28th overall in 2007."),
    h("route", "Played for Bilbao."),
    h("build", "Listed at 6′11″."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("title", "Won the 2014 championship with the Spurs."),
  ],
  1630200: [
    // Tre Jones
    h("college", "Played at Duke.", "same-school"),
    h("draft-slot", "Picked 41st overall in 2020."),
    h("build", "A 6′1″ guard."),
    h("tenure", "Spent five seasons in San Antonio.", "same-tenure"),
    h("games", "Played 279 games for the Spurs."),
    h("playmaking", "Averaged 4.7 assists with San Antonio."),
  ],
  1641705: [
    // Victor Wembanyama
    h("draft-slot", "Went first overall in 2023."),
    h("build", "Listed at 7′4″."),
    h(
      "teenage-line",
      "Joined LeBron James and Kevin Durant as the only teenagers in NBA history with 35+ points, 10+ rebounds and 2+ blocks in a game.",
    ),
    h("defensive-player", "Won Defensive Player of the Year as a Spur."),
    h(
      "five-by-five",
      "Became the youngest player in NBA history to record a 5×5.",
    ),
    h("route", "Played for Metropolitans 92 in France."),
  ],
  1628380: [
    // Zach Collins
    h("college", "Played at Gonzaga.", "same-school"),
    h("draft-slot", "Picked 10th overall in 2017."),
    h("build", "A 6′9″ forward-center."),
    h("tenure", "Spent four seasons in San Antonio.", "same-tenure"),
    h("games", "Played 196 games for the Spurs."),
    h("scoring", "Averaged 9.7 points with San Antonio."),
  ],
  470: [
    // Doc Rivers
    h("all-star", "Made the 1988 All-Star team."),
    h("draft-slot", "Picked 31st overall in 1983."),
    h("college", "Played at Marquette.", "same-school"),
    h("build", "A 6′4″ guard."),
    h("tenure", "Spent two seasons in San Antonio.", "same-tenure"),
    h("spurs-line", "Averaged 4.4 points in 138 games with the Spurs."),
  ],
};
