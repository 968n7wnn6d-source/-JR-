/* =========================
   日本全駅クイズ
   script.js
========================= */


/* =========================
   HTML要素
========================= */

const answerInput =
    document.getElementById("answer");

const answerButton =
    document.getElementById("answer-button");

const giveupButton =
    document.getElementById("giveup-button");

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
   保存場所
========================= */

/*
   localStorageに保存するときの名前。

   「日本全駅クイズ」の回答状況を
   ブラウザ内に保存する。
*/

const STORAGE_KEY =
    "japan-station-quiz-found-stations";


/* =========================
   鉄道会社データ
========================= */

let companies = {};


/* =========================
   正解済み駅
========================= */

/*
   Setを使って、
   正解済み駅を重複なしで管理する。
*/

let foundStationNames =
    new Set();


/* =========================
   保存されている回答を読み込む
========================= */

function loadSavedAnswers() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        /*
           保存データがなければ終了
        */

        if (!saved) {

            return;

        }


        const stationNames =
            JSON.parse(saved);


        /*
           配列ならSetに変換
        */

        if (Array.isArray(stationNames)) {

            foundStationNames =
                new Set(
                    stationNames.map(
                        function(name) {

                            return normalizeStationName(
                                name
                            );

                        }
                    )
                );

        }

    }
    catch (error) {

        console.error(
            "保存データの読み込みに失敗しました。",
            error
        );

        foundStationNames =
            new Set();

    }

}


/* =========================
   回答を保存
========================= */

function saveAnswers() {

    try {

        const data =
            Array.from(
                foundStationNames
            );


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );


    }
    catch (error) {

        console.error(
            "回答の保存に失敗しました。",
            error
        );

    }

}


/* =========================
   駅名を比較用に統一
========================= */

function normalizeStationName(name) {

    /*
       前後の空白を削除
    */

    name = name.trim();


    /*
       全角・半角を統一

       Ａ → A
       ＡＢＣ → ABC
       １２３ → 123
    */

    name = name.normalize("NFKC");


    /*
       ヶとケを統一

       保土ヶ谷
       保土ケ谷

       ↓

       保土ケ谷
    */

    name = name.replace(/ヶ/g, "ケ");
    name = name.replace(/挟/g, "挾");


    return name;

}


/* =========================
   CSV読み込み
========================= */

fetch("./stations.csv?" + Date.now())

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "stations.csv が見つかりません。"
                +
                " HTTPステータス: "
                +
                response.status
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
   CSV解析
========================= */

function loadStations(csvText) {

    try {

        /*
           BOMを削除
        */

        csvText =
            csvText.replace(
                /^\uFEFF/,
                ""
            );


        /*
           改行で分割
        */

        const lines =
            csvText.split(/\r?\n/);


        /*
           データを初期化
        */

        companies = {};


        /*
           1行目は見出しなので除外
        */

        lines
            .slice(1)
            .forEach(
                function(line, index) {

                    /*
                       空行は無視
                    */

                    if (
                        line.trim() === ""
                    ) {

                        return;

                    }


                    /*
                       CSVをカンマで分割
                    */

                    const columns =
                        line.split(",");


                    /*
                       4列必要
                    */

                    if (
                        columns.length < 4
                    ) {

                        throw new Error(
                            "CSVの "
                            +
                            (index + 2)
                            +
                            " 行目が4列になっていません。"
                        );

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
                       会社
                    */

                    if (
                        !companies[companyName]
                    ) {

                        companies[companyName] =
                            {};

                    }


                    /*
                       路線
                    */

                    if (
                        !companies[
                            companyName
                        ][routeName]
                    ) {

                        companies[
                            companyName
                        ][routeName] = [];

                    }


                    /*
                       駅
                    */

                    companies[
                        companyName
                    ][routeName].push({

                        name: stationName,

                        number: number

                    });

                }
            );


        /*
           駅番号順に並べる
        */

        Object.keys(companies)
            .forEach(
                function(companyName) {

                    Object.keys(
                        companies[companyName]
                    )
                    .forEach(
                        function(routeName) {

                            companies[
                                companyName
                            ][routeName]
                            .sort(
                                function(a, b) {

                                    return (
                                        a.number
                                        -
                                        b.number
                                    );

                                }
                            );

                        }
                    );

                }
            );


        /*
           会社・路線・駅を画面に作る
        */

        createCompanies();


        /*
           保存されていた回答を
           画面に反映
        */

        restoreAnswers();


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

                if (
                    event.key === "Enter"
                ) {

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


        /*
           初期表示
        */

        updateProgress();

        updateRouteProgress();

    }
    catch (error) {

        console.error(error);

        message.textContent =
            "CSVエラー：" +
            error.message;

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


            /*
               会社全体
            */

            const companySection =
                document.createElement(
                    "section"
                );

            companySection.classList.add(
                "company"
            );


            /*
               会社トグル
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
                +
                companyName;


            /*
               会社の中身
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

                        toggle.querySelector(
                            ".toggle-arrow"
                        ).textContent =
                            "▼";

                    }
                    else {

                        companyContent.style.display =
                            "none";

                        toggle.querySelector(
                            ".toggle-arrow"
                        ).textContent =
                            "▶";

                    }

                }
            );


            /*
               5列
            */

            const routesGrid =
                document.createElement(
                    "div"
                );

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


            /*
               5列作成
            */

            for (
                let i = 0;
                i < 5;
                i++
            ) {

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
                       路線
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
                       駅を追加
                    */

                    companies[
                        companyName
                    ][routeName]
                    .forEach(
                        function(stationData) {


                            const station =
                                document.createElement(
                                    "span"
                                );


                            station.classList.add(
                                "station"
                            );


                            /*
                               駅名
                            */

                            station.textContent =
                                stationData.name;


                            /*
                               比較用駅名
                            */

                            station.dataset
                                .normalizedName =
                                normalizeStationName(
                                    stationData.name
                                );


                            /*
                               路線
                            */

                            station.dataset.route =
                                routeName;


                            /*
                               会社
                            */

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
                        document.createElement(
                            "p"
                        );

                    progress.classList.add(
                        "route-progress"
                    );


                    progress.innerHTML =
                        '発見駅：'
                        +
                        '<span class="route-found-count">0</span>'
                        +
                        ' / '
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

                    const complete =
                        document.createElement(
                            "p"
                        );

                    complete.classList.add(
                        "complete-message"
                    );


                    route.appendChild(
                        complete
                    );


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
   保存済み回答を復元
========================= */

function restoreAnswers() {

    const stations =
        document.querySelectorAll(
            ".station"
        );


    stations.forEach(
        function(station) {

            const stationName =
                station.dataset
                    .normalizedName;


            if (
                foundStationNames.has(
                    stationName
                )
            ) {

                station.classList.add(
                    "found"
                );

            }

        }
    );

}


/* =========================
   回答
========================= */

function checkAnswer() {

    const answer =
        answerInput.value.trim();


    /*
       空欄なら何もしない
    */

    if (
        answer === ""
    ) {

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
       全駅
    */

    const stations =
        document.querySelectorAll(
            ".station"
        );


    let found = false;


    /*
       全路線を調べる
    */

    stations.forEach(
        function(station) {

            if (
                station.dataset
                    .normalizedName
                ===
                normalizedAnswer
            ) {


                /*
                   黒字にする
                */

                station.classList.add(
                    "found"
                );


                /*
                   Give Upの赤字を解除
                */

                station.classList.remove(
                    "given-up"
                );


                found = true;

            }

        }
    );


    if (found) {

        /*
           正解駅を保存

           ここが今回追加した重要部分
        */

        foundStationNames.add(
            normalizedAnswer
        );


        saveAnswers();


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
       表示更新
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
   Give Up
========================= */

function giveUp() {

    const stations =
        document.querySelectorAll(
            ".station"
        );


    /*
       正解していない駅だけ赤字
    */

    stations.forEach(
        function(station) {

            if (
                !station.classList.contains(
                    "found"
                )
            ) {

                station.classList.add(
                    "given-up"
                );

            }

        }
    );


    /*
       Give Upの状態は保存しない。

       ブラウザを閉じれば、
       赤字表示は消える。

       正解した駅だけが残る。
    */

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
        document.querySelectorAll(
            ".station"
        );


    /*
       全駅を重複なしで取得
    */

    const allStations =
        new Set();


    /*
       正解済み駅を重複なしで取得
    */

    const foundStations =
        new Set();


    stations.forEach(
        function(station) {

            const name =
                station.dataset
                    .normalizedName;


            allStations.add(
                name
            );


            if (
                station.classList.contains(
                    "found"
                )
            ) {

                foundStations.add(
                    name
                );

            }

        }
    );


    const total =
        allStations.size;


    const found =
        foundStations.size;


    /*
       表示
    */

    foundCount.textContent =
        found;


    totalCount.textContent =
        total;


    /*
       パーセント
    */

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

    document
        .querySelectorAll(".route")
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


                /*
                   路線の発見駅数
                */

                const count =
                    route.querySelector(
                        ".route-found-count"
                    );


                count.textContent =
                    found.length;


                /*
                   路線制覇
                */

                const complete =
                    route.querySelector(
                        ".complete-message"
                    );


                if (
                    stations.length > 0
                    &&
                    stations.length
                    ===
                    found.length
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