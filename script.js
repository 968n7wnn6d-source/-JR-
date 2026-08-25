/* =========================================================
   日本全駅クイズ
   script.js
========================================================= */


/* =========================================================
   Supabase設定
========================================================= */

const SUPABASE_URL =
    "https://hwxjvaqnuwovjjtehurf.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hUxCifGQkgJLeKJye-jfxQ_Xt7_XM73";


/* =========================================================
   Supabase接続
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   HTML要素
========================================================= */

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


const averageScore =
    document.getElementById("average-score");


const highestScore =
    document.getElementById("highest-score");


/* =========================================================
   データ
========================================================= */

let companies = {};


/* =========================================================
   現在の挑戦で正解した駅
========================================================= */

let foundStationNames =
    new Set();


/* =========================================================
   Give Up済みか
========================================================= */

let hasGivenUp = false;


/* =========================================================
   駅名の比較用変換
========================================================= */

function normalizeStationName(
    name
) {

    /*
       前後の空白を削除
    */

    name =
        name.trim();


    /*
       全角英数字
       ↓
       半角英数字

       その他のUnicode表記も統一
    */

    name =
        name.normalize(
            "NFKC"
        );


    /*
       ヶとケを統一

       保土ヶ谷
       保土ケ谷

       ↓

       保土ケ谷
    */

    name =
        name.replace(
            /ヶ/g,
            "ケ"
        );


    /*
       挾と挟を統一

       文挾
       文挟

       ↓

       文挾
    */

    name =
        name.replace(
            /挟/g,
            "挾"
        );


    return name;

}


/* =========================================================
   CSV読み込み
========================================================= */

fetch(
    "./stations.csv?" +
    Date.now()
)

.then(
    function(response) {

        if (
            !response.ok
        ) {

            throw new Error(
                "stations.csv が見つかりません。"
                +
                " HTTPステータス: "
                +
                response.status
            );

        }


        return response.text();

    }
)

.then(
    function(csvText) {

        loadStations(
            csvText
        );

    }
)

.catch(
    function(error) {

        console.error(
            error
        );


        message.textContent =
            "駅データを読み込めませんでした。";


        message.style.color =
            "#d00000";

    }
);


/* =========================================================
   CSV解析
========================================================= */

function loadStations(
    csvText
) {

    try {

        /*
           BOM削除
        */

        csvText =
            csvText.replace(
                /^\uFEFF/,
                ""
            );


        /*
           行に分割
        */

        const lines =
            csvText.split(
                /\r?\n/
            );


        companies = {};


        /*
           1行目はヘッダー

           路線名,駅名,番号,所属会社名
        */

        lines
            .slice(1)
            .forEach(
                function(
                    line,
                    index
                ) {

                    /*
                       空行は無視
                    */

                    if (
                        line.trim() === ""
                    ) {

                        return;

                    }


                    /*
                       CSVを4列に分割
                    */

                    const columns =
                        line.split(",");


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
                       会社を作成
                    */

                    if (
                        !companies[
                            companyName
                        ]
                    ) {

                        companies[
                            companyName
                        ] = {};

                    }


                    /*
                       路線を作成
                    */

                    if (
                        !companies[
                            companyName
                        ][
                            routeName
                        ]
                    ) {

                        companies[
                            companyName
                        ][
                            routeName
                        ] = [];

                    }


                    /*
                       駅を追加
                    */

                    companies[
                        companyName
                    ][
                        routeName
                    ].push({

                        name:
                            stationName,

                        number:
                            number

                    });

                }
            );


        /*
           駅番号順に並べる
        */

        Object.keys(
            companies
        )
        .forEach(
            function(
                companyName
            ) {

                Object.keys(
                    companies[
                        companyName
                    ]
                )
                .forEach(
                    function(
                        routeName
                    ) {

                        companies[
                            companyName
                        ][
                            routeName
                        ].sort(
                            function(
                                a,
                                b
                            ) {

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
           画面作成
        */

        createCompanies();


        /*
           ボタンイベント
        */

        answerButton.addEventListener(
            "click",
            checkAnswer
        );


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


        giveupButton.addEventListener(
            "click",
            giveUp
        );


        /*
           初期状態
        */

        updateProgress();

        updateRouteProgress();


        /*
           Supabase統計取得
        */

        loadStatistics();


        /*
           回答欄にフォーカス
        */

        answerInput.focus();

    }
    catch (error) {

        console.error(
            error
        );


        message.textContent =
            "CSVエラー："
            +
            error.message;


        message.style.color =
            "#d00000";

    }

}


/* =========================================================
   会社・路線・駅を作成
========================================================= */

function createCompanies() {

    const companyNames =
        Object.keys(
            companies
        );


    companyNames.forEach(
        function(
            companyName
        ) {

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
               トグル
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
               初期状態は閉じる
            */

            companyContent.style.display =
                "none";


            /*
               開閉処理
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
               5列グリッド
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
                    companies[
                        companyName
                    ]
                );


            /*
               5列に分配
            */

            const routesPerColumn =
                Math.ceil(
                    routeNames.length / 5
                );


            const columns = [];


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
               路線を作成
            */

            routeNames.forEach(
                function(
                    routeName,
                    index
                ) {

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
                    ][
                        routeName
                    ]
                    .forEach(
                        function(
                            stationData
                        ) {

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
                        document.createElement(
                            "p"
                        );


                    progress.classList.add(
                        "route-progress"
                    );


                    progress.innerHTML =
                        "発見駅："
                        +
                        '<span class="route-found-count">0</span>'
                        +
                        " / "
                        +
                        companies[
                            companyName
                        ][
                            routeName
                        ].length
                        +
                        "駅";


                    route.appendChild(
                        progress
                    );


                    /*
                       制覇表示
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


/* =========================================================
   回答処理
========================================================= */

function checkAnswer() {

    /*
       Give Up後は回答不可
    */

    if (
        hasGivenUp
    ) {

        return;

    }


    const answer =
        answerInput.value.trim();


    /*
       空欄
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
       全駅を取得
    */

    const stations =
        document.querySelectorAll(
            ".station"
        );


    let found =
        false;


    /*
       駅名を検索
    */

    stations.forEach(
        function(
            station
        ) {

            if (
                station.dataset
                    .normalizedName
                ===
                normalizedAnswer
            ) {

                /*
                   同名駅が複数路線にあれば
                   すべて黒くする
                */

                station.classList.add(
                    "found"
                );


                station.classList.remove(
                    "given-up"
                );


                found =
                    true;

            }

        }
    );


    /*
       正解
    */

    if (
        found
    ) {

        foundStationNames.add(
            normalizedAnswer
        );


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
       回答率更新
    */

    updateProgress();

    updateRouteProgress();


    /*
       入力欄クリア
    */

    answerInput.value =
        "";


    answerInput.focus();

}


/* =========================================================
   Give Up
========================================================= */

async function giveUp() {

    /*
       1回の挑戦につき1回だけ
    */

    if (
        hasGivenUp
    ) {

        return;

    }


    hasGivenUp =
        true;


    /*
       Give Up時点の回答率
    */

    const score =
        calculateCurrentScore();


    /*
       未回答駅を赤字にする
    */

    const stations =
        document.querySelectorAll(
            ".station"
        );


    stations.forEach(
        function(
            station
        ) {

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
       ボタンを無効化
    */

    giveupButton.disabled =
        true;


    answerButton.disabled =
        true;


    answerInput.disabled =
        true;


    /*
       メッセージ
    */

    message.textContent =
        "Give Up！ 回答率 "
        +
        score.toFixed(1)
        +
        "%";


    message.style.color =
        "#d00000";


    updateProgress();

    updateRouteProgress();


    /*
       Supabaseへ記録
    */

    await submitScore(
        score
    );


    /*
       最新統計取得
    */

    await loadStatistics();

}


/* =========================================================
   現在の回答率を計算
========================================================= */

function calculateCurrentScore() {

    /*
       駅名単位で集合を作る

       同じ駅が複数路線にあっても
       1駅として扱う
    */

    const allStations =
        new Set();


    const foundStations =
        new Set();


    const stations =
        document.querySelectorAll(
            ".station"
        );


    stations.forEach(
        function(
            station
        ) {

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


    /*
       データなし
    */

    if (
        allStations.size === 0
    ) {

        return 0;

    }


    return (
        foundStations.size
        /
        allStations.size
        *
        100
    );

}


/* =========================================================
   回答率表示
========================================================= */

function updateProgress() {

    /*
       駅名単位で集計
    */

    const allStations =
        new Set();


    const foundStations =
        new Set();


    const stations =
        document.querySelectorAll(
            ".station"
        );


    stations.forEach(
        function(
            station
        ) {

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


    foundCount.textContent =
        found;


    totalCount.textContent =
        total;


    const percent =
        total === 0
            ? 0
            : found /
              total *
              100;


    progressPercent.textContent =
        percent.toFixed(
            1
        );

}


/* =========================================================
   路線ごとの進捗
========================================================= */

function updateRouteProgress() {

    document
        .querySelectorAll(
            ".route"
        )
        .forEach(
            function(
                route
            ) {

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


                /*
                   路線内の全駅が埋まった
                */

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


/* =========================================================
   Give Upした回答率をSupabaseへ保存
========================================================= */

async function submitScore(
    score
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "quiz_results"
                )
                .insert({

                    score:
                        Number(
                            score.toFixed(
                                1
                            )
                        )

                });


        if (
            error
        ) {

            console.error(
                "回答率の送信に失敗しました。",
                error
            );


            return false;

        }


        return true;

    }
    catch (error) {

        console.error(
            "Supabaseへの接続に失敗しました。",
            error
        );


        return false;

    }

}


/* =========================================================
   平均・最高をSupabaseから取得
========================================================= */

async function loadStatistics() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "quiz_results"
                )
                .select(
                    "score"
                );


        /*
           エラー
        */

        if (
            error
        ) {

            console.error(
                "統計の取得に失敗しました。",
                error
            );


            averageScore.textContent =
                "--.-%";


            highestScore.textContent =
                "--.-%";


            return;

        }


        /*
           データなし
        */

        if (
            !data
            ||
            data.length === 0
        ) {

            averageScore.textContent =
                "--.-%";


            highestScore.textContent =
                "--.-%";


            return;

        }


        /*
           数値だけ取得
        */

        const scores =
            data
                .map(
                    function(row) {

                        return Number(
                            row.score
                        );

                    }
                )
                .filter(
                    function(score) {

                        return Number.isFinite(
                            score
                        );

                    }
                );


        if (
            scores.length === 0
        ) {

            return;

        }


        /*
           平均
        */

        const total =
            scores.reduce(
                function(
                    sum,
                    score
                ) {

                    return (
                        sum + score
                    );

                },
                0
            );


        const average =
            total /
            scores.length;


        /*
           最高
        */

        const highest =
            Math.max(
                ...scores
            );


        /*
           表示
        */

        averageScore.textContent =
            average.toFixed(
                1
            )
            +
            "%";


        highestScore.textContent =
            highest.toFixed(
                1
            )
            +
            "%";

    }
    catch (error) {

        console.error(
            "統計取得エラー：",
            error
        );

    }

}