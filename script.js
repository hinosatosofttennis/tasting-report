// =======================================================
// データ定義 (white_wine_data.js, red_wine_data.js から読み込まれることを想定)
// 例: const whiteWineData = { "白ワイン": { ... } };
// 例: const redWineData = { "赤ワイン": { ... } };
// 実際にはHTMLの<script>タグで読み込まれているため、ここでは宣言を省略します。
// =======================================================

const ELEMENTS = {
    tastingSections: document.getElementById('tasting-sections'),
    toggleWhite: document.getElementById('toggle-white'),
    toggleRed: document.getElementById('toggle-red'),
    winePhotosInput: document.getElementById('wine-photos'),
    photoPreviewContainer: document.getElementById('photo-preview-container'),
    tastingForm: document.getElementById('tasting-form'),
    recordArea: document.getElementById('record-area'),
    listArea: document.getElementById('list-area'),
    recordTab: document.getElementById('record-tab'),
    listTab: document.getElementById('list-tab'),
    // ... 他の要素も必要に応じて追加
};

let currentWineType = 'white'; // 現在選択中のワインタイプ

// =======================================================
// A. 動的なフォーム生成とタイプ切替
// =======================================================

/**
 * JSONデータに基づき、テイスティング項目セクションのHTMLを生成する
 * @param {object} wineData - 白ワインまたは赤ワインのJSONデータ
 * @returns {string} 生成されたHTML文字列
 */
function generateTastingSections(wineData) {
    // データ構造のトップレベルキー (例: "白ワイン" または "赤ワイン") を取得
    const typeKey = Object.keys(wineData)[0];
    const data = wineData[typeKey];
    let html = '';

    // 大項目 (例: "外観", "香り", "味わい", "評価") のループ
    for (const majorKey in data) {
        html += `<fieldset class="tasting-major-group">
                    <legend>${majorKey}</legend>`;
        
        const majorData = data[majorKey];
        // 中項目 (例: "清澄度", "色調", "粘性"...) のループ
        for (const middleKey in majorData) {
            const middleData = majorData[middleKey];

            // middleDataが配列の場合 (小項目がない場合)
            if (Array.isArray(middleData)) {
                 html += `<div class="tasting-category">
                            <h3>${middleKey}</h3>
                            <div class="tasting-subcategory">`;
                 middleData.forEach(item => {
                    html += `<div class="tasting-comment">
                                <label>
                                    <input type="checkbox" name="${majorKey}_${middleKey}" value="${item.comment}">
                                    ${item.comment}
                                </label>
                            </div>`;
                 });
                 html += `</div></div>`;
            } 
            // middleDataがオブジェクトの場合 (小項目がある場合)
            else if (typeof middleData === 'object' && middleData !== null) {
                html += `<div class="tasting-category">
                            <h3>${middleKey}</h3>`;
                
                // 小項目 (例: "補助用語", "メイン用語", "熟成感/特性"...) のループ
                for (const subKey in middleData) {
                    html += `<div class="tasting-subcategory">
                                <h4>${subKey}</h4>`;
                    
                    middleData[subKey].forEach(item => {
                        // チェックボックスのname属性は、Major_Middle_Sub の形式でユニークにする
                        html += `<div class="tasting-comment">
                                    <label>
                                        <input type="checkbox" name="${majorKey}_${middleKey}_${subKey}" value="${item.comment}">
                                        ${item.comment}
                                    </label>
                                </div>`;
                    });
                    html += `</div>`; // .tasting-subcategory 終了
                }
                html += `</div>`; // .tasting-category 終了
            }
        }

        html += `</fieldset>`; // fieldset 終了
    }

    return html;
}

/**
 * ワインタイプに応じてフォームを切り替える
 * @param {string} type - 'white' または 'red'
 */
function switchWineType(type) {
    if (type === currentWineType) return;

    currentWineType = type;
    
    // 1. データとボタンの切り替え
    const data = (type === 'white') ? whiteWineData : redWineData;
    ELEMENTS.toggleWhite.classList.toggle('active', type === 'white');
    ELEMENTS.toggleRed.classList.toggle('active', type === 'red');

    // 2. フォームの中身を再生成して挿入
    ELEMENTS.tastingSections.innerHTML = generateTastingSections(data);
}

// 初期ロード時のフォーム生成
switchWineType('white');

// イベントリスナーの設定
ELEMENTS.toggleWhite.addEventListener('click', () => switchWineType('white'));
ELEMENTS.toggleRed.addEventListener('click', () => switchWineType('red'));


// =======================================================
// B. 写真プレビュー機能 (最大4枚、画質優先)
// =======================================================

/**
 * ファイル選択時のプレビュー処理と枚数制限のチェック
 */
ELEMENTS.winePhotosInput.addEventListener('change', (event) => {
    const files = event.target.files;
    const maxFiles = 4;
    ELEMENTS.photoPreviewContainer.innerHTML = ''; // 既存のプレビューをクリア

    if (files.length > maxFiles) {
        alert(`選択できる写真は最大${maxFiles}枚までです。最初の${maxFiles}枚のみを処理します。`);
    }

    const filesToProcess = Array.from(files).slice(0, maxFiles);

    if (filesToProcess.length === 0) {
        ELEMENTS.photoPreviewContainer.innerHTML = '<p>選択された写真がここに表示されます。</p>';
        return;
    }

    filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) {
            console.error('画像ファイルを選択してください。');
            return;
        }

        const reader = new FileReader();

        // ファイルの読み込みが完了したときの処理
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result; // Base64データが格納される
            img.classList.add('photo-preview');
            ELEMENTS.photoPreviewContainer.appendChild(img);
        };

        // ファイルをData URL (Base64) として読み込む
        // 画質優先のため、ここではリサイズせずにそのまま読み込みます。
        reader.readAsDataURL(file);
    });
});


// =======================================================
// C. タブ切替機能 (新規記録 <=> 記録リスト)
// =======================================================

function switchTab(tabId) {
    const isActive = tabId === 'record-tab';

    ELEMENTS.recordTab.classList.toggle('active', isActive);
    ELEMENTS.recordArea.classList.toggle('active', isActive);
    ELEMENTS.recordArea.classList.toggle('hidden', !isActive);

    ELEMENTS.listTab.classList.toggle('active', !isActive);
    ELEMENTS.listArea.classList.toggle('active', !isActive);
    ELEMENTS.listArea.classList.toggle('hidden', isActive);
}

ELEMENTS.recordTab.addEventListener('click', () => switchTab('record-tab'));
ELEMENTS.listTab.addEventListener('click', () => {
    switchTab('list-tab');
    // リストタブに切り替えた際、記録リストを読み込む処理をここに追加する (IndexedDBから)
    // loadRecordList();
});

// =======================================================
// D. 記録保存処理 (ダミー - 次のステップでIndexedDBを実装)
// =======================================================

// ELEMENTS.tastingForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     alert('フォーム送信を検知しました。次のステップでIndexedDBへの保存ロジックを実装します！');
//     // ここにフォームデータの収集とIndexedDBへの保存ロジックが入ります。
// });
