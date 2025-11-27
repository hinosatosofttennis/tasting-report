// =======================================================
// グローバル変数とDOM要素の定義
// =======================================================

// JSONデータはHTMLで読み込まれていることを想定
// 例: const whiteWineData = { "白ワイン": { ... } };
// 例: const redWineData = { "赤ワイン": { ... } };

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
    listBody: document.getElementById('list-body'),
    detailModal: document.getElementById('detail-modal'),
    detailContent: document.getElementById('detail-content'),
    closeBtn: document.querySelector('.modal-content .close-btn'),
    exportButton: document.getElementById('export-data-btn')
};
// ... (既存の ELEMENTS オブジェクト定義の後) ...

const METADATA_SELECTIONS = {
    // 地域の選択肢（赤白共通）
    regions: [
        { value: "france", label: "フランス" },
        { value: "italy", label: "イタリア" },
        { value: "usa", label: "アメリカ" },
        { value: "australia", label: "オーストラリア" },
        { value: "chile", label: "チリ" },
        { value: "other", label: "その他" }
    ],
    // 白ワインのブドウ品種
    whiteGrapes: [
        { value: "chardonnay", label: "シャルドネ" },
        { value: "sauvignon_blanc", label: "ソーヴィニヨン・ブラン" },
        { value: "riesling", label: "リースリング" },
        { value: "pinot_gris", label: "ピノ・グリ" },
        { value: "other", label: "その他" }
        
    ],
    // 赤ワインのブドウ品種
    redGrapes: [
        { value: "cabernet_sauvignon", label: "カベルネ・ソーヴィニヨン" },
        { value: "merlot", label: "メルロー" },
        { value: "pinot_noir", label: "ピノ・ノワール" },
        { value: "syrah", label: "シラー" },
        { value: "sangiovese", label: "サンジョヴェーゼ" },
        { value: "other", label: "その他" }
      "カベルネ・フラン",
      "グルナッシュ",
      "ネッビオーロ",
      "テンプラニーリョ",
      "マスカット・ベーリーA",
      "その他"
    ]
};

// ... (既存の DB 定義へ続く) ...

const DB_NAME = 'TastingRecordDB';
const DB_VERSION = 1;
const STORE_NAME = 'tastings';
let db;
let currentWineType = 'white'; // 現在選択中のワインタイプ


// =======================================================
// A. 動的なフォーム生成
// =======================================================

/**
 * JSONデータに基づき、テイスティング項目セクションのHTMLを生成する
 * @param {object} wineData - 白ワインまたは赤ワインのJSONデータ
 * @returns {string} 生成されたHTML文字列
 */
function generateTastingSections(wineData) {
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
                    // name属性は Major_Middle の形式でユニークにする
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

// ... (既存の generateTastingSections 関数の後) ...

/**
 * 収穫年、生産地、ブドウ品種の入力フィールドを生成する
 * @param {string} type - 'white' または 'red'
 * @returns {string} 生成されたHTML文字列
 */
function generateMetadataInputs(type) {
    const grapeOptions = type === 'white' ? METADATA_SELECTIONS.whiteGrapes : METADATA_SELECTIONS.redGrapes;

    // 選択肢のHTMLを生成するヘルパー関数
    const createOptions = (options) => {
        return options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    };

    return `
        <div class="form-row">
            <label for="harvest-year">収穫年 (数字4桁)</label>
            <input type="number" id="harvest-year" name="harvestYear" min="1000" max="9999" placeholder="例: 2022">
        </div>

        <div class="form-row">
            <label for="producer-region">生産地</label>
            <select id="producer-region" name="producerRegion">
                <option value="">-- 選択してください --</option>
                ${createOptions(METADATA_SELECTIONS.regions)}
            </select>
        </div>

        <div class="form-row">
            <label for="main-grape">主なブドウ品種</label>
            <select id="main-grape" name="mainGrape">
                <option value="">-- 選択してください --</option>
                ${createOptions(grapeOptions)}
            </select>
        </div>
    `;
}

// ... (既存の switchWineType 関数の修正) ...

/**
 * ワインタイプに応じてフォームを切り替える (修正版)
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

    // ⭐ 【ここを追記/修正】 メタデータ入力欄の生成 ⭐
    document.getElementById('metadata-content').innerHTML = generateMetadataInputs(type);
}

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

        // ファイルをData URL (Base64) として読み込む (画質優先のためそのまま保存)
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
    loadRecordList(); 
});


// =======================================================
// D. IndexedDB セットアップと操作
// =======================================================

/**
 * IndexedDBデータベースを開き、初期設定を行う
 * @returns {Promise<IDBDatabase>} データベースオブジェクト
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = tempDb.createObjectStore(STORE_NAME, { keyPath: 'recordId' });
                objectStore.createIndex('date', 'date', { unique: false });
                console.log('IndexedDB ObjectStore created/upgraded.');
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * データベースに新しいテイスティング記録を保存する
 * @param {object} recordData - 保存する記録データ
 * @returns {Promise<void>}
 */
function saveRecordToDB(recordData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add(recordData);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * データベースからすべてのテイスティング記録を取得する
 * @returns {Promise<Array<object>>} すべての記録の配列
 */
function getAllRecords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * データベースから単一の記録を取得する
 * @param {string} recordId - 取得する記録のID
 * @returns {Promise<object>} 記録データ
 */
function getRecordById(recordId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(recordId);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * IndexedDBから指定されたIDのテイスティング記録を削除する
 * @param {string} recordId - 削除する記録の一意なID
 * @returns {Promise<void>}
 */
function deleteRecordFromDB(recordId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.delete(recordId);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}


// =======================================================
// E. フォームデータ収集と保存ロジック
// =======================================================

/**
 * フォームからデータを収集し、保存可能なオブジェクトを生成する
 * @param {Event} e - Submitイベント
 */
async function collectAndSaveRecord(e) {
    e.preventDefault();

    // ... (collectAndSaveRecord 関数の先頭を修正) ...

    // 1. 基本情報の収集 (修正部分)
    const form = e.target;
    const recordId = Date.now().toString(); 

    const formData = {
        recordId: recordId,
        date: form.elements['recordDate'].value,
        recorder: form.elements['recorderName'].value,
        wineName: form.elements['wineName'].value,
        wineType: currentWineType === 'white' ? '白ワイン' : '赤ワイン',
        freeText: form.elements['freeText'].value.trim(),
        
        // ⭐ 【ここを追記】 新しいメタデータフィールドの収集 ⭐
        harvestYear: form.elements['harvest-year'].value,
        producerRegion: form.elements['producer-region'].value,
        mainGrape: form.elements['main-grape'].value,
        
        tastingNotes: {},
        images: []
    };

    // 2. チェックボックスデータの収集
    const checkedInputs = form.querySelectorAll('input[type="checkbox"]:checked');
    checkedInputs.forEach(input => {
        const name = input.name; 
        if (!formData.tastingNotes[name]) {
            formData.tastingNotes[name] = [];
        }
        formData.tastingNotes[name].push(input.value);
    });

    // 3. 画像データの収集 (Base64エンコード)
    const files = ELEMENTS.winePhotosInput.files;
    const filesToProcess = Array.from(files).slice(0, 4); 

    for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;

        const base64Image = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        formData.images.push(base64Image);
    }
    
    // 4. IndexedDBへの保存
    try {
        await saveRecordToDB(formData);
        alert('テイスティング記録を保存しました！');
        form.reset(); 
        ELEMENTS.photoPreviewContainer.innerHTML = '<p>選択された写真がここに表示されます。</p>'; 
        loadRecordList(); 
    } catch (error) {
        console.error('保存エラー:', error);
        alert('記録の保存中にエラーが発生しました。コンソールを確認してください。');
    }
}


// =======================================================
// F. 記録リスト表示、詳細、削除ロジック
// =======================================================

/**
 * 記録を削除し、リストを更新する
 * @param {string} recordId - 削除する記録のID
 */
async function deleteRecord(recordId) {
    if (confirm('この記録を完全に削除してもよろしいですか？')) {
        try {
            await deleteRecordFromDB(recordId);
            alert('記録が削除されました。');
            loadRecordList(); 
        } catch (error) {
            console.error('記録の削除エラー:', error);
            alert('記録の削除中にエラーが発生しました。');
        }
    }
}

/**
 * 記録の詳細をモーダルで表示する
 * @param {string} recordId - 表示する記録のID
 */
async function showRecordDetail(recordId) {
    try {
        const record = await getRecordById(recordId);
        if (!record) {
            alert('記録が見つかりませんでした。');
            return;
        }

        // 日時整形
        const formattedDate = new Date(record.date).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit'
        });

        // 画像のHTMLを生成
        const photoHtml = record.images.length > 0 ? 
            `<div class="detail-photos">${record.images.map(base64 => 
                `<img src="${base64}" alt="ワイン写真" class="photo-preview">`
            ).join('')}</div>` : 
            '<p>写真はありません。</p>';

        // テイスティングコメントのHTMLを整形
        let notesHtml = '';
        for (const name in record.tastingNotes) {
            // 例: "外観_清澄度" や "香り_果実_熟度低→高" を整形
            const title = name.replace(/_/g, ' / ').replace(/ /g, '');
            notesHtml += `
                <h4>${title}</h4>
                <p>${record.tastingNotes[name].join('、')}</p>
            `;
        }

        // 詳細コンテンツの構築
        ELEMENTS.detailContent.innerHTML = `
            <h3>${record.wineName} (${record.wineType})</h3>
            <p><strong>記録者:</strong> ${record.recorder}</p>
            <p><strong>記録日時:</strong> ${formattedDate}</p>
            
            <h4>写真 (${record.images.length}枚)</h4>
            ${photoHtml}

            <h4>自由記入欄</h4>
            <p>${record.freeText || '（記入なし）'}</p>

            <div class="detail-notes">
                <h3>テイスティングコメント詳細</h3>
                ${notesHtml || '<p>チェックされたコメントはありません。</p>'}
            </div>
        `;

        ELEMENTS.detailModal.classList.add('visible');
    } catch (error) {
        console.error('詳細表示エラー:', error);
        alert('詳細情報の読み込み中にエラーが発生しました。');
    }
}

/**
 * IndexedDBから記録を読み込み、リスト画面に表示する
 */
async function loadRecordList() {
    try {
        const records = await getAllRecords();
        ELEMENTS.listBody.innerHTML = ''; 

        if (records.length === 0) {
            ELEMENTS.listBody.innerHTML = '<tr><td colspan="7">まだテイスティング記録がありません。</td></tr>';
            return;
        }

        records.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順にソート

        records.forEach(record => {
            const row = ELEMENTS.listBody.insertRow();
            
            // 日時整形
            const formattedDate = new Date(record.date).toLocaleString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit'
            });
            
            // コメント要約 (自由記入欄を使用)
            const commentSummary = record.freeText.length > 30 
                ? record.freeText.substring(0, 30) + '...' 
                : record.freeText || 'なし';

            // 写真有無アイコン
            const photoIcon = record.images && record.images.length > 0 
                ? `📸 (${record.images.length}枚)` 
                : '❌';

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${record.recorder}</td>
                <td>${record.wineName}</td>
                <td>${record.wineType}</td>
                <td>${commentSummary}</td>
                <td>${photoIcon}</td>
                <td>
                    <button data-id="${record.recordId}" class="view-btn">詳細</button>
                    <button data-id="${record.recordId}" class="delete-btn">削除</button>
                </td>
            `;
            
            row.querySelector('.view-btn').addEventListener('click', () => {
                showRecordDetail(record.recordId);
            });
            row.querySelector('.delete-btn').addEventListener('click', () => {
                deleteRecord(record.recordId);
            });
        });
    } catch (error) {
        console.error('記録リストの読み込みエラー:', error);
        ELEMENTS.listBody.innerHTML = '<tr><td colspan="7">記録の読み込み中にエラーが発生しました。</td></tr>';
    }
}


// =======================================================
// G. データエクスポート (CSV / JSON 書き出し)
// =======================================================

/**
 * すべての記録データをCSV形式に変換する
 * @param {Array<object>} records - すべてのテイスティング記録
 * @returns {string} CSV文字列
 */
function convertToCSV(records) {
    if (records.length === 0) return 'No records found.';

    const headers = [
        "RecordID", "記録日時", "記録者", "ワイン名", "ワインタイプ", "自由記入欄", "写真枚数", "チェック項目詳細"
    ];
    let csv = headers.join(',') + '\n';

    records.forEach(record => {
        let tastingDetails = '';
        if (record.tastingNotes) {
            const flatNotes = {};
            for (const key in record.tastingNotes) {
                flatNotes[key] = record.tastingNotes[key].join('、');
            }
            // JSON文字列をエスケープしてCSVセルに格納
            tastingDetails = JSON.stringify(flatNotes).replace(/"/g, '""');
        }

        const row = [
            `"${record.recordId}"`,
            `"${record.date}"`,
            `"${record.recorder}"`,
            `"${record.wineName}"`,
            `"${record.wineType}"`,
            `"${record.freeText.replace(/"/g, '""')}"`, // 自由記入欄をエスケープ
            record.images.length,
            `"${tastingDetails}"` 
        ];

        csv += row.join(',') + '\n';
    });

    return csv;
}

/**
 * データをダウンロード可能なファイルとしてブラウザに提供する
 * @param {string} data - ファイルコンテンツ
 * @param {string} filename - ファイル名
 * @param {string} mimeType - MIMEタイプ
 */
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * エクスポートボタンクリック時のメイン処理
 */
async function handleExport() {
    try {
        const records = await getAllRecords();

        if (records.length === 0) {
            alert('エクスポートする記録がありません。');
            return;
        }

        const format = prompt("エクスポート形式を選択してください (1: CSV, 2: JSON)", "1");

        if (format === '1') {
            const csvData = convertToCSV(records);
            const filename = `Tasting_Records_${new Date().toISOString().slice(0, 10)}.csv`;
            downloadFile(csvData, filename, 'text/csv;charset=utf-8;');
            alert(`CSVファイル (${filename}) のダウンロードを開始します。`);
        } else if (format === '2') {
            const jsonString = JSON.stringify(records, null, 2);
            const filename = `Tasting_Records_${new Date().toISOString().slice(0, 10)}.json`;
            downloadFile(jsonString, filename, 'application/json');
            alert(`JSONファイル (${filename}) のダウンロードを開始します。`);
        } else {
            alert('エクスポートをキャンセルしました。');
        }
        
    } catch (error) {
        console.error('データエクスポートエラー:', error);
        alert('データのエクスポート中にエラーが発生しました。');
    }
}


// =======================================================
// H. 初期設定とイベントリスナーの登録
// =======================================================

// フォーム送信時に保存ロジックを実行
ELEMENTS.tastingForm.addEventListener('submit', collectAndSaveRecord);

// エクスポートボタンにイベントリスナーを設定
ELEMENTS.exportButton.addEventListener('click', handleExport);

// 初期ロード時のフォーム生成とDB接続
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初期フォームの生成
    switchWineType('white');

    // 2. DB接続
    openDB().catch(err => {
        alert('データベースの初期化に失敗しました。記録の保存ができません。');
    });
    // ⭐ 【ここから追記】 ワインタイプ切替ボタンのイベントリスナーを追加 ⭐
        ELEMENTS.toggleWhite.addEventListener('click', () => switchWineType('white'));
        ELEMENTS.toggleRed.addEventListener('click', () => switchWineType('red'));
        // ⭐ 【ここまで追記】 ⭐

    // 3. モーダルの閉じる処理
    ELEMENTS.closeBtn.addEventListener('click', () => {
        ELEMENTS.detailModal.classList.remove('visible');
    });
    window.addEventListener('click', (event) => {
        if (event.target === ELEMENTS.detailModal) {
            ELEMENTS.detailModal.classList.remove('visible');
        }
    });
});
