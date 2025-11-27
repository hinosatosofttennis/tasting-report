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
// =======================================================
// E. IndexedDB セットアップと操作
// =======================================================

const DB_NAME = 'TastingRecordDB';
const DB_VERSION = 1;
const STORE_NAME = 'tastings';
let db;

/**
 * IndexedDBデータベースを開き、初期設定を行う
 * @returns {Promise<IDBDatabase>} データベースオブジェクト
 */
function openDB() {
    return new Promise((resolve, reject) => {
        // ブラウザ互換性を考慮し、ベンダープレフィックスをチェック
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // データベースのバージョンが上がったとき、または初回作成時
        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                // オブジェクトストアを作成し、一意のID（recordId）でインデックスを設定
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
// ... (E. IndexedDB セットアップと操作 の後に追加) ...

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

/**
 * 記録を削除し、リストを更新する
 * @param {string} recordId - 削除する記録のID
 */
async function deleteRecord(recordId) {
    if (confirm('この記録を完全に削除してもよろしいですか？')) {
        try {
            await deleteRecordFromDB(recordId);
            alert('記録が削除されました。');
            loadRecordList(); // リストを再読み込みして更新
        } catch (error) {
            console.error('記録の削除エラー:', error);
            alert('記録の削除中にエラーが発生しました。');
        }
    }
}

// アプリケーション起動時にDBを開く
openDB().catch(err => {
    alert('データベースの初期化に失敗しました。記録の保存ができません。');
});


// =======================================================
// F. フォームデータ収集と保存ロジック
// =======================================================

/**
 * フォームからデータを収集し、保存可能なオブジェクトを生成する
 * @param {Event} e - Submitイベント
 */
async function collectAndSaveRecord(e) {
    e.preventDefault();

    // 1. 基本情報の収集
    const form = e.target;
    const recordId = Date.now().toString(); // 一意のIDとしてタイムスタンプを使用

    const formData = {
        recordId: recordId,
        date: form.elements['recordDate'].value,
        recorder: form.elements['recorderName'].value,
        wineName: form.elements['wineName'].value,
        wineType: currentWineType === 'white' ? '白ワイン' : '赤ワイン',
        freeText: form.elements['freeText'].value.trim(),
        tastingNotes: {},
        images: []
    };

    // 2. チェックボックスデータの収集
    const checkedInputs = form.querySelectorAll('input[type="checkbox"]:checked');
    checkedInputs.forEach(input => {
        // name属性 (例: "外観_清澄度" や "香り_果実_熟度低→高") をキーとして使用
        const name = input.name; 
        if (!formData.tastingNotes[name]) {
            formData.tastingNotes[name] = [];
        }
        formData.tastingNotes[name].push(input.value);
    });

    // 3. 画像データの収集 (Base64エンコード)
    const files = ELEMENTS.winePhotosInput.files;
    const filesToProcess = Array.from(files).slice(0, 4); // 4枚制限を再確認

    for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;

        // Base64エンコードは非同期処理
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
        form.reset(); // フォームをリセット
        ELEMENTS.photoPreviewContainer.innerHTML = '<p>選択された写真がここに表示されます。</p>'; // プレビューをクリア
        // 記録リストを更新
        loadRecordList(); 
    } catch (error) {
        console.error('保存エラー:', error);
        alert('記録の保存中にエラーが発生しました。コンソールを確認してください。');
    }
}

// フォーム送信時に保存ロジックを実行
ELEMENTS.tastingForm.addEventListener('submit', collectAndSaveRecord);


// =======================================================
// G. 記録リスト表示ロジック
// =======================================================

const ELEMENTS_LIST = {
    listBody: document.getElementById('list-body'),
    // ...
};

/**
 * IndexedDBから記録を読み込み、リスト画面に表示する
 */
async function loadRecordList() {
    try {
        const records = await getAllRecords();
        ELEMENTS_LIST.listBody.innerHTML = ''; // リストをクリア

        if (records.length === 0) {
            ELEMENTS_LIST.listBody.innerHTML = '<tr><td colspan="7">まだテイスティング記録がありません。</td></tr>';
            return;
        }

        records.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日付の新しい順にソート

        records.forEach(record => {
            const row = ELEMENTS_LIST.listBody.insertRow();
            
            // 1. 日時 (ISO形式から整形)
            const formattedDate = new Date(record.date).toLocaleString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit'
            });
            
            // 2. コメント要約 (自由記入欄を使用)
            const commentSummary = record.freeText.length > 30 
                ? record.freeText.substring(0, 30) + '...' 
                : record.freeText || 'なし';

            // 3. 写真有無アイコン
            const photoIcon = record.images && record.images.length > 0 
                ? `📸 (${record.images.length}枚)` 
                : '❌';

            // データの挿入
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
            
            // 詳細表示と削除機能のイベントリスナーは、次のステップで実装します。
            // ... (G. 記録リスト表示ロジック の loadRecordList 関数内) ...
            // 削除ボタンと詳細ボタンのイベントリスナーを設定
            row.querySelector('.view-btn').addEventListener('click', () => {
                showRecordDetail(record.recordId);
            });
            row.querySelector('.delete-btn').addEventListener('click', () => {
                deleteRecord(record.recordId);
            });
        });
    } catch (error) {
        console.error('記録リストの読み込みエラー:', error);
        ELEMENTS_LIST.listBody.innerHTML = '<tr><td colspan="7">記録の読み込み中にエラーが発生しました。</td></tr>';
    }
}

// リストタブがアクティブになったときにリストを読み込む（C. タブ切替機能の呼び出しを更新）
ELEMENTS.listTab.addEventListener('click', () => {
    switchTab('list-tab');
    loadRecordList(); // リスト表示に切り替える度に読み込み
});
