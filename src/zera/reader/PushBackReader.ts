export class PushBackReader {
    public limit: number;
    public stream: string[];
    public position: number;

    private _line: number;
    private _column: number;

    constructor(str: string) {
        this.limit = str.length - 1;
        this.stream = str.split("");
        this.position = 0;
        this._line = 1;
        this._column = 1;
    }

    line(): number {
        return this._line;
    }

    column(): number {
        return this._column;
    }

    read(): string | null {
        if (this.position > this.limit) return null;

        var ch = this.stream[this.position];
        this.position++;

        if (ch === "\n") {
            this._column = 1;
            this._line++;
        }
        else {
            this._column++;
        }

        return ch;
    }

    skip(n: number): void {
        this.position += n;
    }

    reset(): void {
        this.position = 0;
    }

    unread(ch: string): void {
        this.position -= 1;
        this.stream[this.position] = ch;
    }
}
