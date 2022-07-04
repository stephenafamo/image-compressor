export namespace main {
	
	export class CompressionOptions {
	    original_file_path: string;
	    original_file_name: string;
	    quality: number;
	    max_width: number;
	    max_height: number;
	
	    static createFrom(source: any = {}) {
	        return new CompressionOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.original_file_path = source["original_file_path"];
	        this.original_file_name = source["original_file_name"];
	        this.quality = source["quality"];
	        this.max_width = source["max_width"];
	        this.max_height = source["max_height"];
	    }
	}
	export class FileInfo {
	    path: string;
	    name: string;
	    image_format: string;
	    size: number;
	    width: number;
	    height: number;
	    // Go type: time.Time
	    last_mod_time: any;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.image_format = source["image_format"];
	        this.size = source["size"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.last_mod_time = this.convertValues(source["last_mod_time"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

