/* Debugging */

SELFHTML.Forum.Debug = {};

/* From http://maiaco.com/articles/computingStatsInJS.php */
/** Returns an object that contains the count, sum,
 * minimum, median, maximum, mean, variance, and
 * standard deviation of the series of numbers stored
 * in the specified array.  This function changes the
 * specified array by sorting its contents. */
function Stats(data) {
    this.count = data.length;

    /* Sort the data so that all seemingly
     * insignificant values such as 0.000000003 will
     * be at the beginning of the array and their
     * contribution to the mean and variance of the
     * data will not be lost because of the precision
     * of the CPU. */
    data.sort(ascend);

    /* Since the data is now sorted, the minimum value
     * is at the beginning of the array, the median
     * value is in the middle of the array, and the
     * maximum value is at the end of the array. */
    this.min = data[0];
    var middle = Math.floor(data.length / 2);
    if ((data.length % 2) != 0) {
        this.median = data[middle];
    }
    else {
        this.median = (data[middle - 1] + data[middle]) / 2;
    }
    this.max = data[data.length - 1];

    /* Compute the mean and variance using a
     * numerically stable algorithm. */
    var sqsum = 0;
    this.mean = data[0];
    for (var i = 1;  i < data.length;  ++i) {
        var x = data[i];
        var delta = x - this.mean;
        var sweep = i + 1.0;
        this.mean += delta / sweep;
        sqsum += delta * delta * (i / sweep);
    }
    this.sum = this.mean * this.count;
    this.variance = sqsum / this.count;
    this.sdev = Math.sqrt(this.variance);
}
/** Returns a string that shows all the properties and
 * their values for this Stats object. */
Stats.prototype.toString = function() {
    var s = 'Stats';
    for (var attr in this) {
        if (typeof(this[attr]) != 'function') {
            s += '  ' + attr + ' ' + this[attr];
        }
    }
    return s;
}


/** Compares two objects using
 * built-in JavaScript operators. */
function ascend(a, b) {
    if (a < b)
        return -1;
    else if (a > b)
        return 1;
    return 0;
}

if (!window.console && window.opera && opera.postError) {
	console = {
		log : function () {
			var message = Array.convert(arguments).join(" ");
			opera.postError(message);
		}
	};
}

Function.prototype.benchmark = function f_Function_prototype_benchmark (iterations) {
	
	var functionNameMatches = this.toString().match(/^function\s+([^(]+)/),
		functionName = functionNameMatches ? functionNameMatches[1] : 'unnamed';
	console.log("benchmarking " + functionName);
	
	iterations = iterations || 1000;
	
	var times = [],
		payloadF = this,
		i = 0,
		interval = setInterval(iterationF, 0);
	
	function iterationF () {
		i++;
		var startTime = new Date().getTime();
		payloadF();
		var endTime = new Date().getTime();
		times.push(endTime - startTime);
		if (i == iterations) {
			end();
		}
	}
	
	function end () {
		clearInterval(interval);
		var stats = new Stats(times);
		console.log(
			iterations + " iterations took " + stats.sum + "ms\n" +
			"mean: " + stats.mean + "ms, median: " + stats.median + "ms, variance: " + stats.variance
		);
	}

};

SELFHTML.Forum.Debug.xpathBenchmark = function f_SELFHTML_Forum_Debug (xpathExpression, contextNode, iterations) {
	contextNode = contextNode || document.body;
	iterations = iterations || 500;
	//console.log("benchmarking\n" + xpathExpression + "\nat", contextNode);
	var start = new Date().getTime();
	try {
		for (var i = 0; i < iterations; i++) {
			var result = document.evaluate(xpathExpression, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		}
	} catch (e) {
		console.debug(e);
		return;
	}
	var end = new Date().getTime();
	var message = "found " + result.snapshotLength + " nodes in " + (end - start) + "ms, average " + ((end - start) / iterations) + "ms";
	for (var i = 0, length = result.snapshotLength; i < length; i++) {
		console.log(result.snapshotItem(i));
	}
	// console.log(message);
	// return result;
	return message;
};

SELFHTML.Forum.Debug.benchmarkQuery = function () {
	var F = SELFHTML.Forum,
		it = 200;
	/*
	if (F.Support.getElementsByClassName) {
		(function getElementsByClassName () {
			//F.threadList.getElementsByClassName('author');
			return false;
		}).benchmark(it);
	}
	*/
	if (F.Support.querySelectorAll) {
		(function querySelectorAll () {
			//F.threadList.querySelectorAll(".author");
			document.querySelectorAll("li.own-posting li:not(.visited)");
		}).benchmark(it);
	}
	(function getElementsByXPath () {
		//F.threadList.getElementsByXPath("descendant::span[@class = 'author']");
		F.threadList.getElementsByXPath("descendant::li[contains(@class, 'own-posting')]/child::ul/child::li[not(contains(@class, 'visited'))]")
	}).benchmark(it);
}