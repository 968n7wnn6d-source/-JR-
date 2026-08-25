const answerInput = document.getElementById("answer");
const answerButton = document.getElementById("answer-button");
const giveupButton = document.getElementById("giveup-button");

const routesContainer = document.getElementById("routes-container");
const message = document.getElementById("message");

const foundCount = document.getElementById("found-count");
const totalCount = document.getElementById("total-count");
const progressPercent = document.getElementById("progress-percent");

let companies = {};


/* =========================
   駅名の表記ゆれを統一
========================= */

function normalizeStationName(name) {

    name = name.trim();

    // 全角英数字 → 半角
    name = name.normalize("NFKC");

    // 「ヶ」と「ケ」を統一
    name = name.replace(/ヶ/g, "ケ");

    return name;
}


/* =========================
   CSV読み込み
========================= */

fetch("./stations.csv?" + Date.now())

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "stations.csv が見つかりません。HTTPステータス: "
                + response.status
            );

        }

        return response.text();

    })

    .then(function(csvText) {

        console.log("CSV読み込み成功");
        console.log(csvText);

        loadStations(csvText);

    })

    .catch(function(error) {

        console.error(error);

        message.textContent =
            "エラー：" + error.message;

        message.style.color = "#d00000";

    });


/* =========================
   CSV解析
========================= */

function loadStations(csvText) {

    try {

        const lines =
            csvText
                .replace(/^\uFEFF/, "")
                .split(/\r?\n/);


        if (lines.length < 2) {

            throw new Error(
                "stations.csv のデータがありません。"
            );

        }


        companies = {};


        /*
           1行目は見出しなので除外
        */

        lines
            .slice(1)
            .forEach(function(line, index) {

                /*
                   空行は無視
                */

                if (line.trim() === "") {
                    return;
                }


                const columns =
                    line.split(",");


                /*
                   4列必要
                */

                if (columns.length < 4) {

                    throw new Error(
                        "CSVの " +
                        (index + 2) +
                        " 行目が4列になっていません。"
                    );

                }


                const routeName =
                    columns[0].trim();

                const stationName =
                    columns[1].trim();

                const number =
                    Number(columns[2].trim());

                const companyName =
                    columns[3].trim();


                if (
                    routeName === "" ||
                    stationName === "" ||
                    companyName === ""
                ) {

                    throw new Error(
                        "CSVの " +
                        (index + 2) +
                        " 行目に空欄があります。"
                    );

                }


                if (Number.isNaN(number)) {

                    throw new Error(
                        "CSVの " +
                        (index + 2) +
                        " 行目の番号が数字ではありません。"
                    );

                }


                /*
                   会社
                */

                if (!companies[companyName]) {

                    companies[companyName] = {};

                }


                /*
                   路線
                */

                if (
                    !companies[companyName][routeName]
                ) {

                    companies[companyName][routeName] = [];

                }


                /*
                   駅
                */

                companies[companyName][routeName]
                    .push({

                        name: stationName,

                        number: number

                    });

            });


        /*
           駅番号順に並べる
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

                                    return a.number - b.number;

                                }
                            );

                    }
                );

            }
        );


        /*
           画面作成
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
           Enterキー
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
           Give Up
        */

        giveupButton.addEventListener(
            "click",
            giveUp
        );


        updateProgress();


        console.log("駅データの読み込み完了");


    }
    catch (error) {

        console.error(error);

        message.textContent =
            "CSVエラー：" + error.message;

        message.style.color =
            "#d00000";

    }

}


/* =========================
   会社・路線・駅を作成
========================= */

function createCompanies() {

    const companyNames =
        Object.keys(companies);


    companyNames.forEach(
        function(companyName) {

            const companySection =
                document.createElement("section");

            companySection.classList.add("company");


            /*
               会社トグル
            */

            const toggle =
                document.createElement("button");

            toggle.classList.add(
                "company-toggle"
            );

            toggle.innerHTML =
                '<span class="toggle-arrow">▶</span> '
                + companyName;


            /*
               会社の中身
            */

            const companyContent =
                document.createElement("div");

            companyContent.classList.add(
                "company-content"
            );

            companyContent.style.display =
                "none";


            toggle.addEventListener(
                "click",
                function() {

                    if (
                        companyContent.style.display
                        === "none"
                    ) {

                        companyContent.style.display =
                            "block";

                        toggle.querySelector(
                            ".toggle-arrow"
                        ).textContent = "▼";

                    }
                    else {

                        companyContent.style.display =
                            "none";

                        toggle.querySelector(
                            ".toggle-arrow"
                        ).textContent = "▶";

                    }

                }
            );


            /*
               5列
            */

            const routesGrid =
                document.createElement("div");

            routesGrid.classList.add(
                "routes-grid"
            );


            const routeNames =
                Object.keys(
                    companies[companyName]
                );


            const routesPerColumn =
                Math.ceil(
                    routeNames.length / 5
                );


            const columns = [];


            for (let i = 0; i < 5; i++) {

                const column =
                    document.createElement("div");

                column.classList.add(
                    "route-column"
                );

                routesGrid.appendChild(
                    column
                );

                columns.push(column);

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


                    const route =
                        document.createElement("section");

                    route.classList.add("route");


                    /*
                       路線名
                    */

                    const title =
                        document.createElement("h2");

                    title.textContent =
                        routeName;

                    route.appendChild(title);


                    /*
                       駅一覧
                    */

                    const stationList =
                        document.createElement("div");

                    stationList.classList.add(
                        "station-list"
                    );


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
                       路線進捗
                    */

                    const progress =
                        document.createElement("p");

                    progress.classList.add(
                        "route-progress"
                    );

                    progress.innerHTML =
                        '発見駅：<span class="route-found-count">0</span> / '
                        +
                        companies[companyName][routeName].length
                        +
                        '駅';


                    route.appendChild(progress);


                    /*
                       路線制覇
                    */

                    const complete =
                        document.createElement("p");

                    complete.classList.add(
                        "complete-message"
                    );

                    route.appendChild(complete);


                    column.appendChild(route);

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
   回答
========================= */

function checkAnswer() {

    const answer =
        answerInput.value.trim();


    if (answer === "") {
        return;
    }


    const normalizedAnswer =
        normalizeStationName(answer);


    const stations =
        document.querySelectorAll(".station");


    let found = false;


    stations.forEach(
        function(station) {

            if (
                station.dataset.normalizedName
                ===
                normalizedAnswer
            ) {

                station.classList.add("found");

                station.classList.remove(
                    "given-up"
                );

                found = true;

            }

        }
    );


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


    updateProgress();

    updateRouteProgress();


    answerInput.value = "";

    answerInput.focus();

}


/* =========================
   Give Up
========================= */

function giveUp() {

    const stations =
        document.querySelectorAll(".station");


    stations.forEach(
        function(station) {

            if (
                !station.classList.contains("found")
            ) {

                station.classList.add(
                    "given-up"
                );

            }

        }
    );


    message.textContent =
        "未回答の駅を赤字で表示しました。";

    message.style.color =
        "#d00000";


    updateProgress();

    updateRouteProgress();


    answerInput.focus();

}


/* =========================
   全国回答率
========================= */

function updateProgress() {

    const stations =
        document.querySelectorAll(".station");


    const allStations =
        new Set();


    const foundStations =
        new Set();


    stations.forEach(
        function(station) {

            const name =
                station.dataset.normalizedName;


            allStations.add(name);


            if (
                station.classList.contains("found")
            ) {

                foundStations.add(name);

            }

        }
    );


    const total =
        allStations.size;


    const found =
        foundStations.size;


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
   路線進捗
========================= */

function updateRouteProgress() {

    document.querySelectorAll(".route")
        .forEach(
            function(route) {

                const stations =
                    route.querySelectorAll(
                        ".station"
                    );


                const found =
                    route.querySelectorAll(
                        ".station.found"
                    );


                const count =
                    route.querySelector(
                        ".route-found-count"
                    );


                count.textContent =
                    found.length;


                const complete =
                    route.querySelector(
                        ".complete-message"
                    );


                if (
                    stations.length > 0 &&
                    stations.length === found.length
                ) {

                    complete.textContent =
                        "路線制覇！";

                }
                else {

                    complete.textContent =
                        "";

                }

            }
        );

}