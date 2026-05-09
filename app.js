class VerticalCalculator {
    constructor() {
        this.current = '0';
        this.previous = '';
        this.op = null;
        this.step = 0; // 0:first num, 1:op, 2:second num
        this.speed = 3;
        this.animating = false;
        this.calculated = false; // 标记刚刚完成计算
        this.historyData = [];
        this.deletedStack = [];
        this.nextId = 1;
        this.init();
    }

    init() {
        // 数字与点
        document.querySelectorAll('[data-number]').forEach(btn => {
            btn.addEventListener('click', () => this.appendNumber(btn.dataset.number));
        });
        // 运算符
        document.querySelectorAll('[data-op]').forEach(btn => {
            btn.addEventListener('click', () => this.chooseOperation(btn.dataset.op));
        });
        // 功能键
        document.querySelector('[data-action="clear"]').addEventListener('click', () => this.clear());
        document.querySelector('[data-action="backspace"]').addEventListener('click', () => this.backspace());
        document.querySelector('[data-action="animate"]').addEventListener('click', () => this.startAnimation());
        // 撤回按钮
        document.getElementById('histUndo').addEventListener('click', () => this.undoDelete());
        // 速度
        const speedRange = document.getElementById('speedRange');
        const speedLabel = document.getElementById('speedLabel');
        const labels = ['', '很慢', '慢', '中', '快', '很快'];
        speedRange.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            speedLabel.textContent = labels[this.speed];
        });
        // 键盘
        document.addEventListener('keydown', (e) => this.handleKey(e));
        this.updateDisplay();
    }

    handleKey(e) {
        if (e.key >= '0' && e.key <= '9') this.appendNumber(e.key);
        else if (e.key === '.') this.appendNumber('.');
        else if (e.key === '+' || e.key === '＋') this.chooseOperation('+');
        else if (e.key === '-' || e.key === '－') this.chooseOperation('-');
        else if (e.key === '*' || e.key === '×') this.chooseOperation('×');
        else if (e.key === '/' || e.key === '÷') this.chooseOperation('÷');
        else if (e.key === 'Enter' || e.key === '=') this.startAnimation();
        else if (e.key === 'Backspace') this.backspace();
        else if (e.key === 'Escape') this.clear();
    }

    appendNumber(num) {
        if (this.animating) return;
        // 如果刚完成计算，输入新数字时自动清空
        if (this.calculated) {
            this.softClear();
        }
        // 如果已选择运算符，开始输入第二个数字
        if (this.step === 1) {
            this.step = 2;
        }
        if (num === '.') {
            if (this.step === 0) {
                if (this.current.includes('.')) return;
                this.current = this.current === '0' ? '0.' : this.current + '.';
            } else {
                if (this.previous.includes('.')) return;
                this.previous = this.previous === '' ? '0.' : this.previous + '.';
            }
        } else {
            if (this.step === 0) {
                this.current = this.current === '0' ? num : this.current + num;
            } else {
                this.previous = this.previous === '0' ? num : (this.previous === '' ? num : this.previous + num);
            }
        }
        this.updateDisplay();
    }

    chooseOperation(op) {
        if (this.animating) return;
        if (this.current === '') return;
        if (this.step === 2) {
            this.startAnimation(true);
            return;
        }
        this.op = op;
        this.step = 1;
        this.updateDisplay();
        // 高亮运算符按钮
        document.querySelectorAll('.op-btn').forEach(b => b.classList.toggle('active', b.dataset.op === op));
    }

    clear() {
        if (this.animating) return;
        this.current = '0';
        this.previous = '';
        this.op = null;
        this.step = 0;
        this.calculated = false;
        this.updateDisplay();
        document.getElementById('verticalWorkspace').innerHTML = '<div class="placeholder">输入数字并选择运算后，点击「开始计算」查看竖式</div>';
        document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
    }

    softClear() {
        // 不清空历史记录和竖式，只重置计算器状态
        this.current = '0';
        this.previous = '';
        this.op = null;
        this.step = 0;
        this.calculated = false;
        this.updateDisplay();
        document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
    }

    backspace() {
        if (this.animating) return;
        if (this.step === 0) {
            this.current = this.current.slice(0, -1) || '0';
        } else if (this.step === 1) {
            this.op = null;
            this.step = 0;
            document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
        } else {
            this.previous = this.previous.slice(0, -1);
            if (this.previous === '') this.step = 1;
        }
        this.updateDisplay();
    }

    updateDisplay() {
        const curEl = document.getElementById('currentOperand');
        const prevEl = document.getElementById('previousOperand');
        curEl.textContent = this.step === 2 ? (this.previous || '0') : this.current;
        if (this.op && this.step >= 1) {
            prevEl.textContent = `${this.current} ${this.op}`;
        } else {
            prevEl.textContent = '';
        }
    }

    addHistory(expression, result) {
        const record = { id: this.nextId++, expression, result };
        this.historyData.push(record);
        this.renderHistory();
    }

    renderHistory() {
        const list = document.getElementById('historyList');
        const undoBtn = document.getElementById('histUndo');
        list.innerHTML = '';

        if (this.historyData.length === 0) {
            list.innerHTML = '<div class="history-empty">暂无记录</div>';
            undoBtn.disabled = this.deletedStack.length === 0;
            return;
        }

        this.historyData.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <button class="hist-delete" data-id="${record.id}" title="删除">🗑</button>
                <span class="hist-index">#${index + 1}</span>
                <div class="hist-expr">${record.expression} =</div>
                <div class="hist-result">${record.result}</div>
            `;
            list.appendChild(item);
        });

        // 绑定删除事件
        list.querySelectorAll('.hist-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('确定要删除这条记录吗？')) {
                    this.deleteHistory(id);
                }
            });
        });

        list.scrollTop = list.scrollHeight;
        undoBtn.disabled = this.deletedStack.length === 0;
    }

    deleteHistory(id) {
        const idx = this.historyData.findIndex(r => r.id === id);
        if (idx >= 0) {
            this.deletedStack.push(this.historyData[idx]);
            this.historyData.splice(idx, 1);
            this.renderHistory();
        }
    }

    undoDelete() {
        if (this.deletedStack.length === 0) return;
        const record = this.deletedStack.pop();
        this.historyData.push(record);
        this.renderHistory();
    }

    getBaseDelay() {
        const map = { 1: 1000, 2: 700, 3: 450, 4: 280, 5: 150 };
        return map[this.speed] || 450;
    }

    wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async startAnimation(skipDisplay = false) {
        if (this.animating) return;
        if (!this.op || this.step < 2 || this.previous === '') return;

        const a = parseFloat(this.current);
        const b = parseFloat(this.previous);
        if (isNaN(a) || isNaN(b)) return;

        // 除法外暂要求整数输入（竖式教学场景）
        const hasDecimal = (this.current.includes('.') && parseFloat(this.current) % 1 !== 0) || 
                           (this.previous.includes('.') && parseFloat(this.previous) % 1 !== 0);
        if (hasDecimal && this.op !== '÷') {
            const workspace = document.getElementById('verticalWorkspace');
            workspace.innerHTML = '<div class="placeholder" style="color:var(--secondary)">加减乘竖式暂支持整数计算哦～</div>';
            this.animating = false;
            return;
        }

        this.animating = true;
        const workspace = document.getElementById('verticalWorkspace');
        workspace.innerHTML = '<div class="placeholder">正在准备竖式...</div>';

        let data;
        try {
            switch (this.op) {
                case '+': data = this.buildAddition(a, b); break;
                case '-': data = this.buildSubtraction(a, b); break;
                case '×': data = this.buildMultiplication(a, b); break;
                case '÷': data = this.buildDivision(a, b); break;
            }
        } catch (e) {
            workspace.innerHTML = `<div class="placeholder" style="color:var(--danger)">计算出错：${e.message}</div>`;
            this.animating = false;
            return;
        }

        workspace.innerHTML = data.html;
        await this.wait(200);
        await this.playSequence(data.sequence, workspace);

        // 记录历史
        let resultValue;
        switch (this.op) {
            case '+': resultValue = a + b; break;
            case '-': resultValue = a - b; break;
            case '×': resultValue = a * b; break;
            case '÷': resultValue = data.displayQuotient; break;
        }
        // 去除数值型结果小数点后多余的 .000
        if (typeof resultValue === 'number') {
            resultValue = parseFloat(resultValue.toPrecision(15));
            if (Number.isInteger(resultValue)) resultValue = String(resultValue);
            else resultValue = String(resultValue);
        }
        this.addHistory(`${this.current} ${this.op} ${this.previous}`, resultValue);
        this.calculated = true;
        this.animating = false;
    }

    async playSequence(sequence, container) {
        const delay = this.getBaseDelay();
        const groups = Array.isArray(sequence) ? sequence : [];

        for (const group of groups) {
            const sels = group.selectors || [];
            const effect = group.effect || 'anim-show';
            for (const sel of sels) {
                container.querySelectorAll(sel).forEach(el => {
                    if (el.classList.contains('anim-pending')) {
                        el.classList.remove('anim-pending');
                        el.classList.add(effect);
                    }
                });
            }
            await this.wait(delay);
        }

        // 最终结果闪烁强调
        const results = container.querySelectorAll('.vf-result');
        for (let i = 0; i < results.length; i++) {
            setTimeout(() => {
                results[i].style.color = 'var(--success)';
                results[i].style.transform = 'scale(1.2)';
                setTimeout(() => {
                    results[i].style.color = '';
                    results[i].style.transform = '';
                }, 400);
            }, i * 120);
        }
        await this.wait(1200);
    }

    /* ===================== 加法 ===================== */
    buildAddition(a, b) {
        const s1 = String(Math.abs(a));
        const s2 = String(Math.abs(b));
        const maxLen = Math.max(s1.length, s2.length);

        // 计算结果与进位
        let carry = 0;
        const resultDigits = [];
        const carryDigits = new Array(maxLen + 2).fill(null);

        for (let i = 0; i < maxLen; i++) {
            const d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            const sum = d1 + d2 + carry;
            resultDigits.unshift(sum % 10);
            carry = Math.floor(sum / 10);
        }
        if (carry > 0) {
            resultDigits.unshift(carry);
        }
        const cols = resultDigits.length;

        // 重新计算进位位置（显示在左一列上方）
        carry = 0;
        for (let i = 0; i < maxLen; i++) {
            const d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            const sum = d1 + d2 + carry;
            const newCarry = Math.floor(sum / 10);
            const col = cols - 1 - i; // 当前列（从右）
            if (newCarry > 0 && col > 0) {
                carryDigits[col - 1] = newCarry;
            }
            carry = newCarry;
        }
        if (carry > 0 && cols > maxLen) {
            carryDigits[0] = carry;
        }

        const rows = [
            'carry',   // 0
            'num1',    // 1
            'opNum2',  // 2
            'line',    // 3
            'result'   // 4
        ];

        let html = `<div class="vertical-form vf-grid" style="grid-template-columns: repeat(${cols}, minmax(32px, auto));">`;
        const sequence = [];

        // 进位行
        for (let c = 0; c < cols; c++) {
            const val = carryDigits[c];
            html += `<div class="vf-cell vf-carry anim-pending" style="grid-row:1; grid-column:${c + 1};" data-step="carry-${c}">${val !== null ? val : ''}</div>`;
        }

        // 被加数行
        for (let c = 0; c < cols; c++) {
            const idx = c - (cols - s1.length);
            const val = (idx >= 0 && idx < s1.length) ? s1[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:2; grid-column:${c + 1};" data-step="n1-${c}">${val}</div>`;
        }

        // 运算符 + 加数行
        html += `<div class="vf-cell vf-operator anim-pending" style="grid-row:3; grid-column:1;" data-step="op">+</div>`;
        for (let c = 1; c < cols; c++) {
            const idx = (c - 1) - (cols - 1 - s2.length);
            const val = (idx >= 0 && idx < s2.length) ? s2[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:3; grid-column:${c + 1};" data-step="n2-${c}">${val}</div>`;
        }

        // 横线
        for (let c = 0; c < cols; c++) {
            html += `<div class="vf-cell vf-line cell-line anim-pending" style="grid-row:4; grid-column:${c + 1};" data-step="line"></div>`;
        }

        // 结果行
        for (let c = 0; c < cols; c++) {
            html += `<div class="vf-cell vf-result anim-pending" style="grid-row:5; grid-column:${c + 1};" data-step="res-${c}">${resultDigits[c]}</div>`;
        }

        html += '</div>';

        // 动画序列
        sequence.push({ selectors: ['[data-step^="n1-"]', '[data-step^="n2-"]', '[data-step="op"]'] });
        sequence.push({ selectors: ['[data-step="line"]'] });

        // 重新计算以便动画
        carry = 0;
        for (let i = 0; i < maxLen; i++) {
            const col = cols - 1 - i;
            const d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            const sum = d1 + d2 + carry;
            const newCarry = Math.floor(sum / 10);

            if (newCarry > 0 && col > 0) {
                sequence.push({ selectors: [`[data-step="carry-${col - 1}"]`], effect: 'anim-pop' });
            }
            sequence.push({ selectors: [`[data-step="res-${col}"]`], effect: 'anim-pop' });
            carry = newCarry;
        }
        if (carry > 0) {
            sequence.push({ selectors: ['[data-step="res-0"]', '[data-step="carry-0"]'], effect: 'anim-pop' });
        }

        return { html, sequence };
    }

    /* ===================== 减法 ===================== */
    buildSubtraction(a, b) {
        let n1 = Math.abs(a), n2 = Math.abs(b);
        let swapped = false;
        if (n1 < n2) { [n1, n2] = [n2, n1]; swapped = true; }
        const s1 = String(n1);
        const s2 = String(n2);
        const maxLen = Math.max(s1.length, s2.length);

        let borrow = 0;
        const resultDigits = [];
        const actualVals = []; // 辅助值（借位后实际值）

        for (let i = 0; i < maxLen; i++) {
            let d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            d1 -= borrow;

            if (d1 < d2) {
                actualVals.push(d1 + 10);
                resultDigits.push(d1 + 10 - d2);
                borrow = 1;
            } else {
                actualVals.push(null);
                resultDigits.push(d1 - d2);
                borrow = 0;
            }
        }
        actualVals.reverse();
        resultDigits.reverse();

        // 去掉结果前导0（如果是0则保留一个）
        while (resultDigits.length > 1 && resultDigits[0] === 0) {
            resultDigits.shift();
            actualVals.shift();
        }

        const cols = resultDigits.length;
        const pad1 = cols - s1.length;
        const pad2 = cols - s2.length;

        let html = `<div class="vertical-form vf-grid" style="grid-template-columns: repeat(${cols}, minmax(32px, auto));">`;
        const sequence = [];

        // 辅助行（借位后实际值）
        for (let c = 0; c < cols; c++) {
            const val = actualVals[c];
            html += `<div class="vf-cell vf-carry borrow anim-pending" style="grid-row:1; grid-column:${c + 1};" data-step="aux-${c}">${val !== null ? val : ''}</div>`;
        }

        // 被减数行
        for (let c = 0; c < cols; c++) {
            const idx = c - pad1;
            const val = (idx >= 0 && idx < s1.length) ? s1[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:2; grid-column:${c + 1};" data-step="n1-${c}">${val}</div>`;
        }

        // 运算符 + 减数行
        html += `<div class="vf-cell vf-operator anim-pending" style="grid-row:3; grid-column:1;" data-step="op">−</div>`;
        for (let c = 1; c < cols; c++) {
            const idx = (c - 1) - pad2;
            const val = (idx >= 0 && idx < s2.length) ? s2[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:3; grid-column:${c + 1};" data-step="n2-${c}">${val}</div>`;
        }

        // 横线
        for (let c = 0; c < cols; c++) {
            html += `<div class="vf-cell vf-line cell-line anim-pending" style="grid-row:4; grid-column:${c + 1};" data-step="line"></div>`;
        }

        // 结果行
        for (let c = 0; c < cols; c++) {
            let val = resultDigits[c];
            if (swapped && c === 0) val = '−' + val;
            html += `<div class="vf-cell vf-result anim-pending" style="grid-row:5; grid-column:${c + 1};" data-step="res-${c}">${val}</div>`;
        }

        html += '</div>';

        sequence.push({ selectors: ['[data-step^="n1-"]', '[data-step^="n2-"]', '[data-step="op"]'] });
        sequence.push({ selectors: ['[data-step="line"]'] });

        // 从右到左逐位动画
        borrow = 0;
        for (let i = 0; i < maxLen; i++) {
            const col = cols - 1 - i;
            if (col < 0) break;
            let d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            d1 -= borrow;

            if (d1 < d2) {
                sequence.push({ selectors: [`[data-step="aux-${col}"]`], effect: 'anim-pop' });
            }
            sequence.push({ selectors: [`[data-step="res-${col}"]`], effect: 'anim-pop' });
            borrow = (d1 < d2) ? 1 : 0;
        }

        return { html, sequence };
    }

    /* ===================== 乘法 ===================== */
    buildMultiplication(a, b) {
        const s1 = String(Math.abs(a)); // 被乘数
        const s2 = String(Math.abs(b)); // 乘数
        const m1 = s1, m2 = s2;

        // 计算最终结果
        const finalResult = String(parseInt(m1) * parseInt(m2));
        const cols = Math.max(finalResult.length, m1.length + m2.length);

        // 计算每个部分积
        const partials = [];
        for (let i = m2.length - 1; i >= 0; i--) {
            const d2 = parseInt(m2[i]);
            let carry = 0;
            const digits = [];
            const carries = [];
            for (let j = m1.length - 1; j >= 0; j--) {
                const prod = parseInt(m1[j]) * d2 + carry;
                digits.unshift(prod % 10);
                carry = Math.floor(prod / 10);
                carries.unshift(carry > 0 ? carry : null);
            }
            if (carry > 0) {
                digits.unshift(carry);
                carries.unshift(null);
            }
            partials.push({ digits, carries, shift: m2.length - 1 - i });
        }

        const gridRows = 2 + partials.length * 2 + 1 + 1; // 被乘数, op+乘数, 横线, (进位+部分积)*n, 横线, 结果
        let html = `<div class="vertical-form vf-grid" style="grid-template-columns: repeat(${cols}, minmax(32px, auto));">`;
        const sequence = [];
        let currentRow = 1;

        // 被乘数行（右对齐）
        for (let c = 0; c < cols; c++) {
            const idx = c - (cols - m1.length);
            const val = (idx >= 0 && idx < m1.length) ? m1[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="m1-${c}">${val}</div>`;
        }
        currentRow++;

        // 运算符 + 乘数行
        html += `<div class="vf-cell vf-operator anim-pending" style="grid-row:${currentRow}; grid-column:1;" data-step="op">×</div>`;
        for (let c = 1; c < cols; c++) {
            const idx = (c - 1) - (cols - 1 - m2.length);
            const val = (idx >= 0 && idx < m2.length) ? m2[idx] : '';
            html += `<div class="vf-cell anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="m2-${c}">${val}</div>`;
        }
        currentRow++;

        // 第一条横线
        for (let c = 0; c < cols; c++) {
            html += `<div class="vf-cell vf-line cell-line anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="line1-${c}"></div>`;
        }
        currentRow++;

        sequence.push({ selectors: ['[data-step^="m1-"]', '[data-step^="m2-"]', '[data-step="op"]'] });
        sequence.push({ selectors: ['[data-step^="line1-"]'] });

        // 部分积
        for (let p = 0; p < partials.length; p++) {
            const part = partials[p];
            const startCol = cols - part.digits.length - part.shift;

            // 进位行
            for (let c = 0; c < cols; c++) {
                const idx = c - startCol;
                const val = (idx >= 0 && idx < part.carries.length) ? (part.carries[idx] !== null ? part.carries[idx] : '') : '';
                html += `<div class="vf-cell vf-carry anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="pcarry-${p}-${c}">${val}</div>`;
            }
            currentRow++;

            // 部分积行
            for (let c = 0; c < cols; c++) {
                const idx = c - startCol;
                const val = (idx >= 0 && idx < part.digits.length) ? part.digits[idx] : '';
                html += `<div class="vf-cell anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="part-${p}-${c}">${val}</div>`;
            }
            currentRow++;

            // 动画：进位和数字从右到左
            for (let d = part.digits.length - 1; d >= 0; d--) {
                const col = startCol + d;
                if (part.carries[d] !== null) {
                    sequence.push({ selectors: [`[data-step="pcarry-${p}-${col}"]`], effect: 'anim-pop' });
                }
                sequence.push({ selectors: [`[data-step="part-${p}-${col}"]`], effect: 'anim-pop' });
            }
        }

        // 结果横线（只有多部分积时需要）
        if (partials.length > 1) {
            for (let c = 0; c < cols; c++) {
                html += `<div class="vf-cell vf-line cell-line anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="line2-${c}"></div>`;
            }
            currentRow++;
            sequence.push({ selectors: ['[data-step^="line2-"]'] });

            // 结果相加的进位
            const sumCarries = this.computeSumCarries(partials, cols);
            for (let c = 0; c < cols; c++) {
                const val = sumCarries[c] !== null ? sumCarries[c] : '';
                html += `<div class="vf-cell vf-carry anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="scarry-${c}">${val}</div>`;
            }
            currentRow++;

            // 从右到左显示结果进位和结果
            for (let c = cols - 1; c >= 0; c--) {
                if (sumCarries[c] !== null) {
                    sequence.push({ selectors: [`[data-step="scarry-${c}"]`], effect: 'anim-pop' });
                }
                sequence.push({ selectors: [`[data-step="res-${c}"]`], effect: 'anim-pop' });
            }
        } else {
            // 只有一行部分积，它就是结果
            sequence.push({ selectors: ['[data-step^="part-0-"]'], effect: 'anim-pop' });
        }

        // 结果行
        if (partials.length > 1) {
            for (let c = 0; c < cols; c++) {
                const idx = c - (cols - finalResult.length);
                const val = (idx >= 0 && idx < finalResult.length) ? finalResult[idx] : '';
                html += `<div class="vf-cell vf-result anim-pending" style="grid-row:${currentRow}; grid-column:${c + 1};" data-step="res-${c}">${val}</div>`;
            }
        } else {
            // 单行乘法：将部分积行标记为结果样式
            for (let c = 0; c < cols; c++) {
                const stepSel = `data-step="part-0-${c}"`;
                html = html.replace(stepSel, stepSel + ' style="font-weight:bold;color:var(--success);"');
            }
        }

        html += '</div>';
        return { html, sequence };
    }

    computeSumCarries(partials, cols) {
        // 计算部分积相加时的进位（仅用于多部分积的结果上方显示）
        const colSum = new Array(cols).fill(0);
        for (const p of partials) {
            const startCol = cols - p.digits.length - p.shift;
            for (let i = 0; i < p.digits.length; i++) {
                colSum[startCol + i] += p.digits[i];
            }
        }
        const carries = new Array(cols).fill(null);
        let carry = 0;
        for (let c = cols - 1; c >= 0; c--) {
            const sum = colSum[c] + carry;
            carry = Math.floor(sum / 10);
            if (carry > 0 && c > 0) {
                carries[c - 1] = carry;
            }
        }
        return carries;
    }

    /* ===================== 除法 ===================== */
    buildDivision(a, b) {
        if (b === 0) throw new Error('除数不能为0');
        const isNegative = (a < 0) !== (b < 0);
        const dividend = Math.abs(a);
        const divisor = Math.abs(b);

        // 处理被除数字符串（保留小数点显示）
        const dStr = String(dividend);
        const parts = dStr.split('.');
        const intStr = parts[0];
        const decStr = parts[1] || '';
        const allDigits = (intStr + decStr).split('').map(Number);
        const decimalPos = intStr.length; // 小数点在数字序列中的位置

        // 长除法计算
        let remainder = 0;
        let quotient = '';
        const steps = [];
        const seen = new Map();
        const maxDecimals = 10;
        let repeatingStart = -1;

        for (let i = 0; i < allDigits.length + maxDecimals; i++) {
            let digit = (i < allDigits.length) ? allDigits[i] : 0;
            remainder = remainder * 10 + digit;

            if (remainder < divisor) {
                quotient += '0';
                steps.push({ q: '0', product: 0, remainder, partial: remainder });
            } else {
                const q = Math.floor(remainder / divisor);
                const p = q * divisor;
                const r = remainder - p;
                quotient += String(q);
                steps.push({ q: String(q), product: p, remainder: r, partial: remainder });
                remainder = r;
            }

            // 整除立即停止
            if (remainder === 0) break;
            if (i >= decimalPos) {
                if (repeatingStart < 0 && seen.has(remainder)) {
                    repeatingStart = seen.get(remainder);
                }
                if (repeatingStart < 0) {
                    seen.set(remainder, quotient.length - 1);
                }
            }
        }

        // 构建带小数点的商显示（去掉整数部分前导0）
        let intPart = quotient.slice(0, decimalPos).replace(/^0+/, '') || '0';
        let decPart = quotient.slice(decimalPos);
        let displayQuotient = '';
        let decPointIdx = -1;
        let decStartNumIdx = -1; // 小数部分第一个数字的索引
        if (isNegative) displayQuotient = '-';
        displayQuotient += intPart;
        if (decPart.length > 0 || remainder !== 0) {
            displayQuotient += '.';
            decPointIdx = displayQuotient.length - 1;
            decStartNumIdx = intPart.length + (isNegative ? 1 : 0);
            displayQuotient += decPart;
        }

        // 计算被省略的前导0个数
        let leadingZeros = 0;
        const rawInt = quotient.slice(0, decimalPos);
        for (let k = 0; k < rawInt.length; k++) {
            if (rawInt[k] === '0') leadingZeros++;
            else break;
        }
        // 如果商本身就是0，不要跳过显示
        if (leadingZeros >= decimalPos && decPart.length === 0 && remainder === 0) {
            leadingZeros = 0;
        }

        // 商的HTML，每位独立动画，固定宽度
        let qHtml = '';
        let numIdx = 0;
        for (let i = 0; i < displayQuotient.length; i++) {
            const ch = displayQuotient[i];
            if (ch === '-') {
                qHtml += `<span class="vf-digit anim-pending" data-step="qsign">-</span>`;
            } else if (ch === '.') {
                qHtml += `<span class="vf-digit decimal-point anim-pending" data-step="qdot">.</span>`;
            } else {
                // 映射到 quotient 索引
                let qIdx;
                if (numIdx < intPart.length) {
                    qIdx = decimalPos - intPart.length + numIdx;
                } else {
                    qIdx = decimalPos + (numIdx - intPart.length);
                }
                const isInDecimal = (decStartNumIdx >= 0 && numIdx >= decStartNumIdx - (isNegative ? 1 : 0));
                let cls = 'vf-digit';
                if (isInDecimal && repeatingStart >= 0 && qIdx >= repeatingStart) {
                    cls += ' overline';
                }
                qHtml += `<span class="${cls} anim-pending" data-step="qchar-${numIdx}">${ch}</span>`;
                numIdx++;
            }
        }

        const divisorStr = String(divisor);
        const CHAR_WIDTH = 2; // em，每个字符固定宽度
        const getCol = (digitIdx) => digitIdx < decimalPos ? digitIdx : digitIdx + 1;

        // 计算最大列数，确保被除数显示覆盖整个计算过程
        const maxStepI = steps.length - 1;
        const maxCol = getCol(maxStepI);

        // 构建被除数显示（扩展到足够宽度，包含补充的0）
        let dividendChars = [];
        for (let c = 0; c <= maxCol; c++) {
            if (c === decimalPos) {
                dividendChars.push('.');
            } else {
                const digitIdx = c < decimalPos ? c : c - 1;
                if (digitIdx < allDigits.length) {
                    dividendChars.push(String(allDigits[digitIdx]));
                } else {
                    dividendChars.push('0');
                }
            }
        }
        const dividendDisplay = dividendChars.join('');

        // 辅助：把字符串拆成固定宽度的字符 span
        const digitSpans = (text) => {
            let s = '';
            for (let ch of String(text)) {
                s += `<span class="vf-digit">${ch}</span>`;
            }
            return s;
        };

        // 构建被除数（每位固定宽度）
        let dividendHtml = '';
        for (let ch of dividendDisplay) {
            dividendHtml += `<span class="vf-digit">${ch}</span>`;
        }

        // 构建虚线（列之间，覆盖整个计算宽度）
        let gridLinesHtml = '';
        for (let c = 1; c <= maxCol; c++) {
            gridLinesHtml += `<div class="vf-grid-line" style="left:${c * CHAR_WIDTH}em"></div>`;
        }

        // 商的起始列偏移（对齐被除数）
        const qStartCol = leadingZeros < decimalPos ? getCol(leadingZeros) : 0;

        let html = `<div class="vertical-form vf-division">`;
        html += `<div class="vf-divisor anim-pending" data-step="divisor">${divisorStr}</div>`;
        html += `<div class="vf-division-body">`;
        html += `<div class="vf-quotient" style="padding-left:calc(12px + ${qStartCol * CHAR_WIDTH}em)">${qHtml}</div>`;
        html += `<div class="vf-dividend-area">`;
        html += `<div class="vf-grid-lines">${gridLinesHtml}</div>`;
        html += `<div class="vf-dividend-main anim-pending" data-step="dividend">${dividendHtml}</div>`;
        html += `<div class="vf-division-steps">`;

        const sequence = [];
        sequence.push({ selectors: ['[data-step="divisor"]', '[data-step="dividend"]'] });
        if (displayQuotient.startsWith('-')) {
            sequence.push({ selectors: ['[data-step="qsign"]'] });
        }

        // 除法动画：先显示整数商位，再逐位显示小数商位和步骤
        const qSelectors = [];
        if (displayQuotient.startsWith('-')) qSelectors.push('[data-step="qsign"]');
        for (let n = 0; n < intPart.length; n++) qSelectors.push(`[data-step="qchar-${n}"]`);
        if (decPointIdx >= 0) qSelectors.push('[data-step="qdot"]');
        if (qSelectors.length > 0) sequence.push({ selectors: qSelectors, effect: 'anim-show' });

        let numCount = intPart.length;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const isDecimalStep = i >= decimalPos;

            if (isDecimalStep && numCount < numIdx) {
                sequence.push({ selectors: [`[data-step="qchar-${numCount}"]`], effect: 'anim-pop' });
                numCount++;
            }

            const partialStr = String(step.partial);
            const productStr = String(step.product);
            const remStr = String(step.remainder);
            const startIdx = i - partialStr.length + 1;
            const endCol = getCol(i);

            const productStartCol = endCol - productStr.length + 1;
            const remStartCol = endCol - remStr.length + 1;

            html += `<div class="vf-step-row anim-pending" data-step="row-${i}">`;
            html += `<div class="vf-step-product anim-pending" style="padding-left:${productStartCol * CHAR_WIDTH}em" data-step="prod-${i}">${digitSpans(productStr)}</div>`;
            html += `<div class="vf-step-remainder anim-pending" style="padding-left:${remStartCol * CHAR_WIDTH}em" data-step="rem-${i}">${digitSpans(remStr)}</div>`;
            html += `</div>`;

            sequence.push({ selectors: [`[data-step="row-${i}"]`, `[data-step="prod-${i}"]`], effect: 'anim-show' });
            sequence.push({ selectors: [`[data-step="rem-${i}"]`], effect: 'anim-pop' });
        }

        html += '</div></div></div></div>';

        return { html, sequence, displayQuotient };
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    new VerticalCalculator();
});
