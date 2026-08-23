/* =========================
   日本全駅クイズ
   script.js
========================= */


/* =========================
   HTMLの要素を取得
========================= */

const answerInput =
    document.getElementById("answer");

const answerButton =
    document.getElementById("answer-button");

const routesContainer =
    document.getElementById("routes-container");

const message =
    document.getElementById("message");

const foundCount =
    document.getElementById("found-count");

const totalCount =
    document.getElementById("total-count");

const progressPercent =
    document.getElementById("progress-percent");


/* =========================
   データ
========================= */

let companies = {};


/* =========================
   駅名の表記を統一
========================= */

function normalizeStationName(name) {

    /*
       前後の空白を削除
    */

    name = name.trim();


    /*
       全角・半角を統一

       Ａ → A
       Ｂ → B
       １２３ → 123

       など
    */

    name = name.normalize("NFKC");


    /*
       「ヶ」と「ケ」を統一

       保土ヶ谷
       ↓
       保土ケ谷
    */

    name = name.replace(/ヶ/g, "ケ");


    return name;
}


/* =========================
   CSVを読み込む
========================= */

fetch("stations.csv")

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "CSVを読み込めませんでした"
            );

        }

        return response.text();

    })

    .then(function(csvText) {

        loadStations(csvText);

    })

    .catch(function(error) {

        console.error(error);

        message.textContent =
            "駅データを読み込めませんでした。";

        message.style.color =
            "#d00000";

    });


/* =========================
   CSVを解析
========================= */

function loadStations(csvText) {

    const lines =
        csvText
            .trim()
            .split(/\r?\n/);


    /*
       1行目は見出し

       空行は無視
    */

    const dataLines =
        lines
            .slice(1)
            .filter(function(line) {

                return line.trim() !== "";

            });


    companies = {};


    dataLines.forEach(function(line) {

        const columns =
            line.split(",");


        /*
           4列未満なら無視
        */

        if (columns.length < 4) {

            return;

        }


        const routeName =
            columns[0].trim();

        const stationName =
            columns[1].trim();

        const number =
            Number(
                columns[2].trim()
            );

        const companyName =
            columns[3].trim();


        /*
           会社がまだ存在しなければ作成
        */

        if (!companies[companyName]) {

            companies[companyName] = {};

        }


        /*
           路線がまだ存在しなければ作成
        */

        if (
            !companies[companyName][routeName]
        ) {

            companies[companyName][routeName] = [];

        }


        /*
           駅を追加
        */

        companies[companyName][routeName].push({

            name: stationName,

            number: number

        });

    });


    /*
       各路線の駅を番号順に並べる
    */

    Object.keys(companies).forEach(
        function(companyName) {

            Object.keys(
                companies[companyName]
            ).forEach(
                function(routeName) {

                    companies[companyName][routeName]
                        .sort(
                            function(a, b) {

                                return (
                                    a.number -
                                    b.number
                                );

                            }
                        );

                }
            );

        }
    );


    /*
       会社別画面を作成
    */

    createCompanies();


    /*
       回答ボタン
    */

    answerButton.addEventListener(
        "click",
        checkAnswer
    );


    /*
       Enterキーでも回答
    */

    answerInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                checkAnswer();

            }

        }
    );


    /*
       初期進捗
    */

    updateProgress();

}


/* =========================
   会社別画面を作成
========================= */

function createCompanies() {

    const companyNames =
        Object.keys(companies);


    companyNames.forEach(
        function(companyName) {


            /*
               会社全体の枠
            */

            const companySection =
                document.createElement(
                    "section"
                );

            companySection.classList.add(
                "company"
            );


            /*
               会社名のトグル
            */

            const toggle =
                document.createElement(
                    "button"
                );

            toggle.classList.add(
                "company-toggle"
            );


            toggle.innerHTML =
                '<span class="toggle-arrow">▶</span> '
                + companyName;


            /*
               路線を入れる部分
            */

            const companyContent =
                document.createElement(
                    "div"
                );

            companyContent.classList.add(
                "company-content"
            );


            /*
               最初は閉じる
            */

            companyContent.style.display =
                "none";


            /*
               クリックで開閉
            */

            toggle.addEventListener(
                "click",
                function() {

                    if (
                        companyContent.style.display
                        ===
                        "none"
                    ) {

                        companyContent.style.display =
                            "block";

                        toggle
                            .querySelector(
                                ".toggle-arrow"
                            )
                            .textContent = "▼";

                    }
                    else {

                        companyContent.style.display =
                            "none";

                        toggle
                            .querySelector(
                                ".toggle-arrow"
                            )
                            .textContent = "▶";

                    }

                }
            );


            /*
               5列レイアウト
            */

            const routesGrid =
                document.createElement(
                    "div"
                );

            routesGrid.classList.add(
                "routes-grid"
            );


            /*
               路線名一覧
            */

            const routeNames =
                Object.keys(
                    companies[companyName]
                );


            /*
               5列に分ける
            */

            const routesPerColumn =
                Math.ceil(
                    routeNames.length / 5
                );


            /*
               5列を作成
            */

            const columns = [];


            for (let i = 0; i < 5; i++) {

                const column =
                    document.createElement(
                        "div"
                    );

                column.classList.add(
                    "route-column"
                );


                routesGrid.appendChild(
                    column
                );


                columns.push(
                    column
                );

            }


            /*
               路線を配置
            */

            routeNames.forEach(
                function(routeName, index) {


                    const columnIndex =
                        Math.floor(
                            index /
                            routesPerColumn
                        );


                    const column =
                        columns[
                            Math.min(
                                columnIndex,
                                4
                            )
                        ];


                    /*
                       路線の枠
                    */

                    const route =
                        document.createElement(
                            "section"
                        );

                    route.classList.add(
                        "route"
                    );


                    /*
                       路線名
                    */

                    const title =
                        document.createElement(
                            "h2"
                        );

                    title.textContent =
                        routeName;


                    route.appendChild(
                        title
                    );


                    /*
                       駅一覧
                    */

                    const stationList =
                        document.createElement(
                            "div"
                        );

                    stationList.classList.add(
                        "station-list"
                    );


                    /*
                       駅を作成
                    */

                    companies[companyName][routeName]
                        .forEach(
                            function(stationData) {


                                const station =
                                    document.createElement(
                                        "span"
                                    );


                                station.classList.add(
                                    "station"
                                );


                                station.textContent =
                                    stationData.name;


                                /*
                                   比較用の駅名
                                */

                                station.dataset
                                    .normalizedName =
                                    normalizeStationName(
                                        stationData.name
                                    );


                                station.dataset.route =
                                    routeName;


                                station.dataset.company =
                                    companyName;


                                stationList.appendChild(
                                    station
                                );

                            }
                        );


                    route.appendChild(
                        stationList
                    );


                    /*
                       路線の進捗
                    */

                    const progress =
                        document.createElement(
                            "p"
                        );


                    progress.classList.add(
                        "route-progress"
                    );


                    progress.innerHTML =
                        '発見駅：<span class="route-found-count">0</span> / '
                        +
                        companies[
                            companyName
                        ][routeName].length
                        +
                        '駅';


                    route.appendChild(
                        progress
                    );


                    /*
                       路線制覇
                    */

                    const completeMessage =
                        document.createElement(
                            "p"
                        );


                    completeMessage.classList.add(
                        "complete-message"
                    );


                    route.appendChild(
                        completeMessage
                    );


                    /*
                       列に追加
                    */

                    column.appendChild(
                        route
                    );

                }
            );


            companyContent.appendChild(
                routesGrid
            );


            companySection.appendChild(
                toggle
            );


            companySection.appendChild(
                companyContent
            );


            routesContainer.appendChild(
                companySection
            );

        }
    );

}


/* =========================
   回答判定
========================= */

function checkAnswer() {

    const answer =
        answerInput.value.trim();


    /*
       空欄なら終了
    */

    if (answer === "") {

        return;

    }


    /*
       入力された駅名を統一
    */

    const normalizedAnswer =
        normalizeStationName(
            answer
        );


    /*
       全駅を取得
    */

    const stations =
        document.querySelectorAll(
            ".station"
        );


    let found = false;


    /*
       同じ駅名が複数路線にあれば
       全部表示
    */

    stations.forEach(
        function(station) {


            if (
                station.dataset
                    .normalizedName
                ===
                normalizedAnswer
            ) {


                station.classList.add(
                    "found"
                );


                found = true;

            }

        }
    );


    /*
       結果表示
    */

    if (found) {

        message.textContent =
            "正解！";

        message.style.color =
            "#008000";

    }
    else {

        message.textContent =
            "その駅はありません。";

        message.style.color =
            "#d00000";

    }


    /*
       進捗更新
    */

    updateProgress();

    updateRouteProgress();


    /*
       入力欄を空にする
    */

    answerInput.value = "";

    answerInput.focus();

}


/* =========================
   全国の進捗
========================= */

function updateProgress() {

    const stations =
        document.querySelectorAll(
            ".station"
        );


    /*
       駅名を重複なしで取得
    */

    const uniqueStations =
        new Set();


    stations.forEach(
        function(station) {

            uniqueStations.add(
                station.dataset
                    .normalizedName
            );

        }
    );


    /*
       発見済み駅
    */

    const uniqueFoundStations =
        new Set();


    stations.forEach(
        function(station) {

            if (
                station.classList.contains(
                    "found"
                )
            ) {

                uniqueFoundStations.add(
                    station.dataset
                        .normalizedName
                );

            }

        }
    );


    const total =
        uniqueStations.size;


    const found =
        uniqueFoundStations.size;


    foundCount.textContent =
        found;


    totalCount.textContent =
        total;


    const percent =
        total === 0
            ? 0
            : found / total * 100;


    progressPercent.textContent =
        percent.toFixed(1);

}


/* =========================
   路線ごとの進捗
========================= */

function updateRouteProgress() {

    const routeElements =
        document.querySelectorAll(
            ".route"
        );


    routeElements.forEach(
        function(route) {


            const stations =
                route.querySelectorAll(
                    ".station"
                );


            const foundStations =
                route.querySelectorAll(
                    ".station.found"
                );


            const total =
                stations.length;


            const found =
                foundStations.length;


            const count =
                route.querySelector(
                    ".route-found-count"
                );


            count.textContent =
                found;


            /*
               全駅発見
            */

            if (
                total > 0 &&
                found === total
            ) {

                const completeMessage =
                    route.querySelector(
                        ".complete-message"
                    );


                completeMessage.textContent =
                    "路線制覇！";

            }

        }
    );

}