import * as tslib_1 from "tslib";
import * as events from 'phovea_core/src/event';
// import {AppConstants, ChangeTypes} from './app_constants';
// import * as d3 from 'd3';
import { Config } from './config';
import { select, selectAll, event } from 'd3-selection';
import { format } from 'd3-format';
import { scaleLinear } from 'd3-scale';
import { max, min, mean } from 'd3-array';
import { axisBottom } from 'd3-axis';
import { isNullOrUndefined } from 'util';
import { transition } from 'd3-transition';
import { easeLinear } from 'd3-ease';
import { curveBasis } from 'd3-shape';
import { VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL, VALUE_TYPE_STRING } from 'phovea_core/src/datatype';
import { line } from 'd3-shape';
import { PRIMARY_SELECTED, COL_ORDER_CHANGED_EVENT, POI_SELECTED, TABLE_VIS_ROWS_CHANGED_EVENT } from './tableManager';
import { isUndefined } from 'util';
var sortedState;
(function (sortedState) {
    sortedState[sortedState["Ascending"] = 0] = "Ascending";
    sortedState[sortedState["Descending"] = 1] = "Descending";
    sortedState[sortedState["Unsorted"] = 2] = "Unsorted";
})(sortedState || (sortedState = {}));
/**
 * Creates the attribute table view
 */
var attributeTable = (function () {
    function attributeTable(parent) {
        this.buffer = 10; //pixel dist between columns
        //for entire Table
        this.y = scaleLinear();
        //for Cell Renderers
        this.yScale = scaleLinear();
        this.xScale = scaleLinear();
        this.rowHeight = Config.glyphSize * 2.5 - 4;
        this.colWidths = {
            idtype: this.rowHeight * 4,
            categorical: this.rowHeight,
            int: this.rowHeight * 4,
            real: this.rowHeight * 4,
            string: this.rowHeight * 5,
            id: this.rowHeight * 4.5,
            dataDensity: this.rowHeight
        };
        this.lineFunction = line()
            .x(function (d) {
            return d.x;
        }).y(function (d) {
            return d.y;
        })
            .curve(curveBasis);
        this.catOffset = 30;
        //Keeps track of whether the table is sorted by a certain attribute;
        this.sortAttribute = { state: sortedState.Unsorted, data: undefined, name: undefined };
        this.idScale = scaleLinear(); //used to size the bars in the first col of the table;
        this.margin = Config.margin;
        this.$node = select(parent);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<FilterBar>}
     */
    attributeTable.prototype.init = function (data) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.tableManager = data;
                        this.build(); //builds the DOM
                        // sets up the data & binds it to svg groups
                        return [4 /*yield*/, this.update()];
                    case 1:
                        // sets up the data & binds it to svg groups
                        _a.sent();
                        this.attachListener();
                        // return the promise directly as long there is no dynamical data to update
                        return [2 /*return*/, Promise.resolve(this)];
                }
            });
        });
    };
    attributeTable.prototype.update = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initData()];
                    case 1:
                        _a.sent();
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build the basic DOM elements and binds the change function
     */
    attributeTable.prototype.build = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var svg, button;
            return tslib_1.__generator(this, function (_a) {
                //Height is a function of the current view and so is set in initData();
                this.width = 1200 - this.margin.left - this.margin.right;
                this.height = Config.glyphSize * 3 * this.tableManager.graphTable.nrow; //- this.margin.top - this.margin.bottom;
                svg = this.$node.append('svg')
                    .classed('tableSVG', true)
                    .attr('width', this.width + this.margin.left + this.margin.right)
                    .attr('height', this.height + this.margin.top + this.margin.bottom);
                // TABLE (except for slope Chart and first col on the left of the slope chart)
                this.table = svg.append('g')
                    .attr('transform', 'translate(' + Config.collapseSlopeChartWidth + ' , 0)')
                    .attr('id', 'tableGroup');
                //HEADERS
                select('#headerGroup').append('g')
                    .attr('transform', 'translate(590, 0)')
                    .attr('id', 'tableHeaders');
                //Column Summaries
                select('#headerGroup').append('g')
                    .attr('transform', 'translate(590, 15)')
                    .attr('id', 'colSummaries');
                //Columns (except for the first)
                select('#tableGroup').append('g')
                    .attr('transform', 'translate(0, ' + this.margin.top + ')')
                    .attr('id', 'columns');
                //Highlight Bars
                select('#columns').append('g')
                    .attr('transform', 'translate(0, ' + this.margin.top + ')')
                    .attr('id', 'highlightBars');
                //SlopeChart and first col
                svg.append('g')
                    .attr('transform', 'translate(0, ' + this.margin.top + ')')
                    .attr('id', 'slopeChart');
                select('#slopeChart').append('g')
                    .attr('id', 'firstCol');
                select('#slopeChart').append('g')
                    .attr('id', 'slopeLines');
                button = select('#headers')
                    .append('g')
                    .attr('transform', 'translate(635,70)')
                    .attr('id', 'revertTreeOrder')
                    .attr('visibility', 'hidden')
                    .append('svg');
                button.append('rect')
                    .attr('width', 120)
                    .attr('height', 25)
                    .attr('rx', 10)
                    .attr('ry', 20)
                    .attr('fill', '#b4b3b1')
                    .attr('y', 0)
                    .attr('opacity', .1)
                    .on('click', function (d) {
                    _this.sortAttribute.state = sortedState.Unsorted;
                    selectAll('.sortIcon')
                        .classed('sortSelected', false);
                    select('#revertTreeOrder')
                        .attr('visibility', 'hidden');
                    var t2 = transition('test').duration(600).ease(easeLinear);
                    select('#columns').selectAll('.cell')
                        .transition(t2)
                        .attr('transform', function (cell) {
                        return ('translate(0, ' + _this.y(_this.rowOrder[cell.ind]) + ' )');
                    });
                    //translate tableGroup to make room for the slope lines.
                    select('#tableGroup')
                        .transition(t2)
                        .attr('transform', function () {
                        return ('translate(' + Config.collapseSlopeChartWidth + ' ,0)');
                    });
                    select('#tableHeaders')
                        .transition(t2)
                        .attr('transform', function () {
                        return ('translate(' + (560 + Config.collapseSlopeChartWidth) + ' ,0)');
                    });
                    select('#colSummaries')
                        .transition(t2)
                        .attr('transform', function () {
                        return ('translate(' + (560 + Config.collapseSlopeChartWidth) + ' ,15)');
                    });
                    selectAll('.slopeLine')
                        .transition(t2)
                        .attr('d', function (d) {
                        return _this.slopeChart({ y: d.y, ind: d.ind, width: Config.collapseSlopeChartWidth });
                    });
                    select('#tableGroup').selectAll('.highlightBar')
                        .transition(t2)
                        .attr('y', function (d) {
                        return _this.y(_this.rowOrder[d.i]);
                    });
                });
                button.append('text')
                    .classed('histogramLabel', true)
                    .attr('x', 60)
                    .attr('y', 15)
                    .attr('fill', '#757472')
                    .text('Sort by Tree')
                    .attr('text-anchor', 'middle');
                return [2 /*return*/];
            });
        });
    };
    attributeTable.prototype.initData = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var graphView, attributeView, allCols, colOrder, orderedCols, _i, colOrder_1, colName, _a, allCols_1, vector, graphIDs, y2personDict, yDict, allRows, col, maxAggregates, _b, allRows_1, key, value, colDataAccum, allPromises, finishedPromises;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // this.colOffsets = [-Config.slopeChartWidth];
                        this.colOffsets = [0];
                        return [4 /*yield*/, this.tableManager.graphTable];
                    case 1:
                        graphView = _c.sent();
                        return [4 /*yield*/, this.tableManager.tableTable];
                    case 2:
                        attributeView = _c.sent();
                        allCols = graphView.cols().concat(attributeView.cols());
                        colOrder = this.tableManager.colOrder;
                        orderedCols = [];
                        for (_i = 0, colOrder_1 = colOrder; _i < colOrder_1.length; _i++) {
                            colName = colOrder_1[_i];
                            for (_a = 0, allCols_1 = allCols; _a < allCols_1.length; _a++) {
                                vector = allCols_1[_a];
                                if (vector.desc.name === colName) {
                                    orderedCols.push(vector);
                                }
                            }
                        }
                        return [4 /*yield*/, graphView.col(0).names()];
                    case 3:
                        graphIDs = _c.sent();
                        y2personDict = {};
                        yDict = this.tableManager.yValues;
                        // console.log('yDict', yDict)
                        graphIDs.forEach(function (person) {
                            if (person in yDict) {
                                //Handle Duplicate Nodes
                                yDict[person].forEach(function (y) {
                                    if (y in y2personDict) {
                                        y2personDict[y].push(person);
                                    }
                                    else {
                                        y2personDict[y] = [person];
                                    }
                                });
                            }
                        });
                        allRows = Object.keys(y2personDict).map(Number);
                        // console.log('allrows', allRows)
                        //Set height of svg
                        this.height = Config.glyphSize * 3 * (max(allRows) - min(allRows) + 1);
                        select('.tableSVG').attr('height', this.height + this.margin.top + this.margin.bottom);
                        this.y.range([0, this.height]).domain([1, max(allRows)]);
                        this.rowOrder = allRows; //will be used to set the y position of each cell/row;
                        col = {};
                        col.data = [];
                        col.name = ['# People'];
                        // col.ys = allRows;
                        col.type = 'dataDensity';
                        col.stats = [];
                        col.isSorted = false;
                        maxAggregates = 1;
                        for (_b = 0, allRows_1 = allRows; _b < allRows_1.length; _b++) {
                            key = allRows_1[_b];
                            value = Array.from(new Set(y2personDict[key])).length;
                            col.data.push(value);
                            maxAggregates = max([maxAggregates, y2personDict[key].length]);
                        }
                        this.idScale.domain([1, maxAggregates]);
                        col.ids = allRows.map(function (row) {
                            return y2personDict[row];
                        });
                        this.firstCol = [col];
                        colDataAccum = [];
                        allPromises = [];
                        orderedCols.forEach(function (vector, index) {
                            allPromises = allPromises.concat([
                                vector.data(),
                                vector.names(),
                                vector.ids(),
                                vector.stats().catch(function () { }),
                                vector.hist(10).catch(function () { })
                            ]);
                        });
                        return [4 /*yield*/, Promise.all(allPromises)];
                    case 4:
                        finishedPromises = _c.sent();
                        // for (const vector of orderedCols) {
                        orderedCols.forEach(function (vector, index) {
                            var data = finishedPromises[index * 5];
                            var peopleIDs = finishedPromises[index * 5 + 1];
                            // for (const vector of orderedCols) {
                            // //   orderedCols.forEach(function (vector){
                            //   const data = await vector.data();
                            //   const peopleIDs = await vector.names();
                            //
                            //   const idRanges  = await vector.ids();
                            //
                            //   const uniqueIDs = idRanges.dim(0).asList().map(d=>{return d.toString()});
                            // console.log('col name is ', vector.desc.name, 'vector.data() size is ', data.length, 'vector.names() size is ', peopleIDs.length, 'vector.ids() size is ', uniqueIDs.length)
                            var type = vector.valuetype.type;
                            var name = vector.desc.name;
                            if (type === VALUE_TYPE_CATEGORICAL) {
                                //Build col offsets array ;
                                var allCategories_1 = vector.desc.value.categories.map(function (c) {
                                    return c.name;
                                }); //get categories from index.json def
                                var categories = void 0;
                                //Only need one col for binary categories
                                if (allCategories_1.length < 3) {
                                    if (allCategories_1.find(function (d) {
                                        return d === 'Y';
                                    })) {
                                        categories = ['Y'];
                                    }
                                    else if (allCategories_1.find(function (d) {
                                        return d === 'True';
                                    })) {
                                        categories = ['True'];
                                    }
                                    else if (allCategories_1.find(function (d) {
                                        return d === 'F';
                                    })) {
                                        categories = ['F'];
                                    }
                                    else {
                                        categories = [allCategories_1[0]];
                                    }
                                }
                                else {
                                    categories = allCategories_1;
                                }
                                // console.log(categories)
                                if (categories.length > 2) {
                                    var numColsBefore = _this.colOffsets.length - 1;
                                    _this.colOffsets[numColsBefore] += _this.catOffset;
                                }
                                var _loop_1 = function (cat) {
                                    var col_1 = {};
                                    col_1.isSorted = false;
                                    col_1.ids = allRows.map(function (row) {
                                        return y2personDict[row];
                                    });
                                    col_1.name = name;
                                    col_1.category = cat;
                                    //Ensure there is an element for every person in the graph, even if empty
                                    col_1.data = allRows.map(function (row) {
                                        var colData = [];
                                        var people = y2personDict[row];
                                        people.map(function (person) {
                                            var ind = peopleIDs.indexOf(person); //find this person in the attribute data
                                            //If there are only two categories, save both category values in this column. Else, only save the ones that match the category at hand.
                                            if (ind > -1 && (allCategories_1.length < 3 || ind > -1 && (allCategories_1.length > 2 && data[ind] === cat))) {
                                                colData.push(data[ind]);
                                            }
                                            else {
                                                colData.push(undefined);
                                            }
                                        });
                                        return colData;
                                    });
                                    col_1.type = type;
                                    var maxOffset = max(_this.colOffsets);
                                    _this.colOffsets.push(maxOffset + _this.buffer * 2 + _this.colWidths[type]);
                                    colDataAccum.push(col_1);
                                };
                                for (var _i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
                                    var cat = categories_1[_i];
                                    _loop_1(cat);
                                }
                                if (categories.length > 2) {
                                    var numColsAfter = _this.colOffsets.length - 1;
                                    _this.colOffsets[numColsAfter] += _this.catOffset;
                                }
                            }
                            else if (type === VALUE_TYPE_INT || type === VALUE_TYPE_REAL) {
                                var maxOffset = max(_this.colOffsets);
                                _this.colOffsets.push(maxOffset + _this.buffer + _this.colWidths[type]);
                                var col_2 = {};
                                col_2.isSorted = false;
                                col_2.ids = allRows.map(function (row) {
                                    return y2personDict[row];
                                });
                                // const stats = await vector.stats();
                                var stats = finishedPromises[5 * index + 3];
                                col_2.name = name;
                                col_2.data = allRows.map(function (row) {
                                    var colData = [];
                                    var people = y2personDict[row];
                                    people.map(function (person) {
                                        var ind = peopleIDs.lastIndexOf(person); //find this person in the attribute data
                                        if (ind > -1) {
                                            // console.log(peopleIDs, col.data)
                                            colData.push(data[ind]);
                                        }
                                        else {
                                            colData.push(undefined);
                                        }
                                    });
                                    return colData;
                                });
                                col_2.vector = vector;
                                col_2.type = type;
                                col_2.stats = stats;
                                col_2.hist = finishedPromises[5 * index + 4];
                                // col.hist = await vector.hist(10);
                                colDataAccum.push(col_2);
                            }
                            else if (type === VALUE_TYPE_STRING) {
                                var maxOffset = max(_this.colOffsets);
                                _this.colOffsets.push(maxOffset + _this.buffer + _this.colWidths[type]);
                                var col_3 = {};
                                col_3.isSorted = false;
                                col_3.ids = allRows.map(function (row) {
                                    return y2personDict[row];
                                });
                                col_3.name = name;
                                col_3.data = allRows.map(function (row) {
                                    var colData = [];
                                    var people = y2personDict[row];
                                    people.map(function (person) {
                                        var ind = peopleIDs.lastIndexOf(person); //find this person in the attribute data
                                        if (ind > -1) {
                                            colData.push(data[ind]);
                                        }
                                        else {
                                            colData.push(undefined);
                                        }
                                    });
                                    return colData;
                                });
                                col_3.type = type;
                                colDataAccum.push(col_3);
                            }
                            else if (type === 'idtype') {
                                var col_4 = {};
                                col_4.ids = allRows.map(function (row) {
                                    return y2personDict[row];
                                });
                                col_4.name = name;
                                col_4.data = allRows.map(function (row) {
                                    var colData = [];
                                    var people = y2personDict[row];
                                    people.map(function (person) {
                                        // console.log(data,person)
                                        var ind = peopleIDs.indexOf(person); //find this person in the attribute data
                                        if (ind > -1) {
                                            if (isUndefined(data[ind])) {
                                                console.log('problem');
                                                console.log(name, data.size(), peopleIDs.size());
                                            }
                                            colData.push(data[ind].toString());
                                        }
                                        else {
                                            colData.push(undefined);
                                        }
                                    });
                                    return colData;
                                });
                                col_4.ys = allRows;
                                col_4.type = type;
                                colDataAccum.push(col_4);
                                var maxOffset = max(_this.colOffsets);
                                // if (name === 'KindredID'){
                                //   console.log(col.data[0], 'length', col.data[0].length)
                                //   this.colOffsets.push(maxOffset + this.buffer +  col.data[0][0].length*7);
                                //
                                // }else{
                                _this.colOffsets.push(maxOffset + _this.buffer + _this.colWidths[type]);
                            }
                        });
                        this.colData = colDataAccum;
                        return [2 /*return*/];
                }
            });
        });
    };
    //renders the DOM elements
    attributeTable.prototype.render = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var t, self, y, headers, headerEnter, colSummaries, colSummariesEnter, highlightBars, highlightBarsEnter, slopeLines, slopeLinesEnter, cols, colsEnter, firstCol, firstColEnter, firstCells, firstCellsEnter, rowLines, rowLinesEnter, cells, cellsEnter;
            return tslib_1.__generator(this, function (_a) {
                t = transition('t').ease(easeLinear);
                self = this;
                y = this.y;
                headers = select('#tableHeaders').selectAll('.header')
                    .data(this.colData.map(function (d, i) {
                    return {
                        'name': d.name, 'data': d, 'ind': i, 'type': d.type,
                        'max': d.max, 'min': d.min, 'mean': d.mean, 'category': d.category, 'isSorted': d.isSorted
                    };
                }), function (d) {
                    return d.name;
                });
                headers.exit().attr('opacity', 0).remove(); // should remove headers of removed col's
                headerEnter = headers
                    .enter()
                    .append('text')
                    .classed('header', true);
                headers = headerEnter.merge(headers);
                headers
                    .text(function (d) {
                    if (d.category && d.category !== 'TRUE' && d.category !== 'Y')
                        return d.name + ' (' + d.category + ')';
                    else
                        return d.name; //.slice(0,15)
                })
                    .attr('transform', function (d, i) {
                    var offset = _this.colOffsets[i] + (_this.colWidths[d.type] / 2);
                    return (d.type === VALUE_TYPE_CATEGORICAL || d.type === 'dataDensity' || d.name.length > 10) ? 'translate(' + offset + ',0) rotate(-40)' : 'translate(' + offset + ',0)';
                })
                    .attr('text-anchor', function (d) {
                    return (d.type === VALUE_TYPE_CATEGORICAL || d.type === 'dataDensity' || d.name.length > 10) ? 'start' : 'middle';
                });
                colSummaries = select('#colSummaries').selectAll('.colSummary')
                    .data(this.colData.map(function (d) {
                    return d;
                }), function (d) {
                    return d.name;
                });
                colSummariesEnter = colSummaries.enter().append('g').classed('colSummary', true);
                colSummaries.exit().remove();
                colSummaries = colSummariesEnter.merge(colSummaries);
                colSummaries.each(function (cell) {
                    if (cell.type === VALUE_TYPE_CATEGORICAL) {
                        self.renderCategoricalHeader(select(this), cell);
                    }
                    else if (cell.type === VALUE_TYPE_INT || cell.type === VALUE_TYPE_REAL) {
                        self.renderIntHeaderHist(select(this), cell);
                    }
                    else if (cell.type === VALUE_TYPE_STRING) {
                        self.renderStringHeader(select(this), cell);
                    }
                    else if (cell.type === 'id' || cell.type === 'idtype') {
                        self.addSortingIcons(select(this), cell);
                    }
                });
                colSummaries
                    .transition(t)
                    .attr('transform', function (d, i) {
                    var offset = _this.colOffsets[i];
                    return 'translate(' + offset + ',0)';
                });
                highlightBars = select('#columns').selectAll('.highlightBar')
                    .data(this.rowOrder.map(function (d, i) {
                    return { 'y': d, 'i': i };
                }), function (d) {
                    return d.y;
                });
                highlightBars.exit().remove();
                highlightBarsEnter = highlightBars.enter().append('rect').classed('highlightBar', true);
                highlightBars = highlightBarsEnter.merge(highlightBars);
                highlightBars
                    .attr('x', 0)
                    .attr('y', function (d) {
                    return _this.y(_this.rowOrder[d.i]);
                })
                    .attr('width', max(this.colOffsets))
                    .attr('height', this.rowHeight)
                    .attr('opacity', 0)
                    .on('mouseover', function (d) {
                    function selected(e) {
                        var returnValue = false;
                        //Highlight the current row in the graph and table
                        if (e.y === Math.round(d.y)) {
                            returnValue = true;
                        }
                        return returnValue;
                    }
                    selectAll('.slopeLine').classed('selectedSlope', false);
                    selectAll('.slopeLine').filter(function (e) {
                        return e.y === Math.round(d.y);
                    }).classed('selectedSlope', true);
                    //Set opacity of corresponding highlightBar
                    selectAll('.highlightBar').filter(selected).attr('opacity', .2);
                })
                    .on('mouseout', function () {
                    selectAll('.slopeLine').classed('selectedSlope', false);
                    //Hide all the highlightBars
                    selectAll('.highlightBar').attr('opacity', 0);
                    // events.fire('row_mouseout', d.y);
                })
                    .on('click', function (d) {
                    console.log('clicked');
                    if (event.defaultPrevented)
                        return; // dragged
                    var wasSelected = selectAll('.highlightBar').filter(function (e) {
                        return e.y === d.y || e.y === Math.round(d.y);
                    }).classed('selected');
                    //'Unselect all other background bars if ctrl was not pressed
                    if (!event.metaKey) {
                        selectAll('.slopeLine').classed('clickedSlope', false);
                        selectAll('.highlightBar').classed('selected', false);
                    }
                    selectAll('.slopeLine').filter(function (e) {
                        return e.y === d.y || e.y === Math.round(d.y);
                    }).classed('clickedSlope', function () {
                        return (!wasSelected);
                    });
                    selectAll('.highlightBar').filter(function (e) {
                        return e.y === d.y || e.y === Math.round(d.y);
                    }).classed('selected', function () {
                        return (!wasSelected);
                    });
                });
                slopeLines = select('#slopeLines').selectAll('.slopeLine')
                    .data(this.rowOrder.map(function (d, i) {
                    return { y: d, ind: i, width: Config.collapseSlopeChartWidth };
                }), function (d) {
                    return d.y;
                });
                slopeLines.exit().remove();
                slopeLinesEnter = slopeLines.enter().append('path');
                slopeLines = slopeLinesEnter.merge(slopeLines)
                    .attr('class', 'slopeLine')
                    .attr('d', function (d) {
                    return _this.slopeChart(d);
                });
                cols = select('#columns').selectAll('.dataCols')
                    .data(this.colData.map(function (d, i) {
                    return {
                        'name': d.name, 'data': d.data, 'ind': i, 'type': d.type,
                        'ids': d.ids, 'stats': d.stats, 'varName': d.name, 'category': d.category, 'vector': d.vector
                    };
                }), function (d) {
                    return d.varName;
                });
                cols.exit().remove(); // should remove on col remove
                colsEnter = cols.enter()
                    .append('g')
                    .classed('dataCols', true);
                cols = colsEnter.merge(cols); //;
                //translate columns horizontally to their position;
                cols
                    .transition(t)
                    .attr('transform', function (d, i) {
                    var offset = _this.colOffsets[i];
                    return 'translate(' + offset + ',0)';
                });
                firstCol = select('#slopeChart').selectAll('.dataCols')
                    .data(this.firstCol.map(function (d, i) {
                    var out = {
                        'name': d.name, 'data': d.data, 'ind': i, 'type': d.type,
                        'ids': d.ids, 'stats': d.stats, 'varName': d.name, 'category': d.category, 'vector': d.vector
                    };
                    return out;
                }), function (d) {
                    return d.varName;
                });
                firstCol.exit().attr('opacity', 0).remove(); // should remove on col remove
                firstColEnter = firstCol.enter()
                    .append('g')
                    .classed('dataCols', true);
                firstCol = firstColEnter.merge(firstCol); //;
                firstCells = firstCol.selectAll('.cell')
                    .data(function (d) {
                    return d.data.map(function (e, i) {
                        return {
                            'id': d.ids[i],
                            'name': d.name,
                            'data': e,
                            'ind': i,
                            'type': d.type,
                            'stats': d.stats,
                            'varName': d.name,
                            'category': d.category,
                            'vector': d.vector
                        };
                    });
                }, function (d) {
                    return d.id[0];
                });
                firstCells.exit().remove();
                firstCellsEnter = firstCells.enter()
                    .append('g')
                    .attr('class', 'cell');
                firstCells = firstCellsEnter.merge(firstCells);
                firstCellsEnter.attr('opacity', 0);
                firstCells
                    .attr('transform', function (cell, i) {
                    return ('translate(0, ' + y(_this.rowOrder[i]) + ' )'); //the x translation is taken care of by the group this cell is nested in.
                });
                firstCellsEnter.attr('opacity', 1);
                firstCells.each(function (cell) {
                    self.renderDataDensCell(select(this), cell);
                });
                rowLines = select('#columns').selectAll('.rowLine')
                    .data(this.rowOrder, function (d) {
                    return d;
                });
                rowLines.exit().remove();
                rowLinesEnter = rowLines.enter().append('line').classed('rowLine', true);
                rowLines = rowLinesEnter.merge(rowLines);
                selectAll('.rowLine')
                    .attr('x1', 0)
                    .attr('y1', function (d) {
                    return _this.y(d) + _this.rowHeight;
                })
                    .attr('x2', max(this.colOffsets))
                    .attr('y2', function (d) {
                    return _this.y(d) + _this.rowHeight;
                });
                cells = cols.selectAll('.cell')
                    .data(function (d) {
                    return d.data.map(function (e, i) {
                        return {
                            'id': d.ids[i],
                            'name': d.name,
                            'data': e,
                            'ind': i,
                            'type': d.type,
                            'stats': d.stats,
                            'varName': d.name,
                            'category': d.category,
                            'vector': d.vector
                        };
                    });
                }, function (d) {
                    return d.id[0];
                });
                cells.exit().remove();
                cellsEnter = cells.enter()
                    .append('g')
                    .attr('class', 'cell');
                cells = cellsEnter.merge(cells);
                // console.log('there are a total of ', cells.size() , 'cells')
                cellsEnter.attr('opacity', 0);
                cells
                    .transition(t)
                    .attr('transform', function (cell, i) {
                    return ('translate(0, ' + y(_this.rowOrder[i]) + ' )'); //the x translation is taken care of by the group this cell is nested in.
                });
                cellsEnter.attr('opacity', 1);
                cells.each(function (cell) {
                    if (cell.type === VALUE_TYPE_CATEGORICAL) {
                        self.renderCategoricalCell(select(this), cell);
                    }
                    else if (cell.type === VALUE_TYPE_INT || cell.type === VALUE_TYPE_REAL) {
                        self.renderIntCell(select(this), cell);
                    }
                    else if (cell.type === VALUE_TYPE_STRING) {
                        self.renderStringCell(select(this), cell);
                    }
                    else if (cell.name === 'KindredID') {
                        self.renderFamilyIDCell(select(this), cell);
                    }
                    else if (cell.type === 'id' || cell.type === 'idtype') {
                        self.renderIdCell(select(this), cell);
                    }
                    else if (cell.type === 'dataDensity') {
                        self.renderDataDensCell(select(this), cell);
                    }
                });
                // If a sortAttribute has been set, sort by that attribute
                if (this.sortAttribute.state !== sortedState.Unsorted) {
                    this.sortRows(this.sortAttribute.data, this.sortAttribute.state);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     *
     * This function sorts the table by the current Attribute
     *
     * @param d data to be sorted
     * @param ascending, boolean flag set to true if sort order is ascending
     */
    attributeTable.prototype.sortRows = function (d, sortOrder) {
        var _this = this;
        var t2 = transition('t2').duration(600).ease(easeLinear);
        //get data from colData array
        var toSort = this.colData.find(function (c) {
            return c.name === d.name;
        }).data;
        // temporary array holds objects with position and sort-value
        var mapped = toSort.map(function (el, i) {
            if (d.type === VALUE_TYPE_REAL || d.type === VALUE_TYPE_INT) {
                return isNaN(+mean(el)) ? { index: i, value: undefined } : { index: i, value: +mean(el) };
            }
            else if (d.type === VALUE_TYPE_STRING) {
                return (isUndefined(el[0]) || el[0].length === 0) ? { index: i, value: undefined } : {
                    index: i,
                    value: el[0].toLowerCase()
                };
            }
            else if (d.type === VALUE_TYPE_CATEGORICAL) {
                return {
                    index: i, value: +(el.filter(function (e) {
                        return e === d.category;
                    }).length / el.length)
                };
            }
            else if (d.type === 'idtype') {
                var equalValues_1 = el.reduce(function (a, b) {
                    return (a === b) ? a : NaN;
                }); //check for array that has all equal values in an aggregate (such as KindredId);
                return isNaN(equalValues_1) ? { index: i, value: undefined } : { index: i, value: equalValues_1 };
            }
        });
        var equalValues = mapped.reduce(function (a, b) {
            return (a.value === b.value) ? a : NaN;
        }); //check for array that has all equal values in an aggregate (such as KindredId);
        //All values are the same, no sorting needed;
        if (!isNaN(equalValues.value)) {
            return;
        }
        select('#revertTreeOrder')
            .transition(t2.transition().duration(500).ease(easeLinear))
            .attr('visibility', 'visible');
        // sorting the mapped array containing the reduced values
        if (sortOrder === sortedState.Ascending) {
            mapped.sort(function (a, b) {
                if (a.value === b.value)
                    return 0;
                if (b.value === undefined || a.value < b.value)
                    return -1;
                if (a.value === undefined || a.value > b.value)
                    return 1;
            });
        }
        else {
            mapped.sort(function (a, b) {
                if (a.value === b.value)
                    return 0;
                if (a.value < b.value)
                    return 1;
                if (a.value === undefined || b.value === undefined || a.value > b.value)
                    return -1;
            });
        }
        // container for the resulting order
        var sortedIndexes = mapped.map(function (el) {
            return el.index;
        });
        var sortedArray = mapped.map(function (el) {
            return toSort[el.index];
        });
        // let cellSelection = select('#columns').selectAll('.cell');
        select('#columns')
            .selectAll('.cell')
            .transition(t2)
            .attr('transform', function (cell) {
            return ('translate(0, ' + _this.y(_this.rowOrder[sortedIndexes.indexOf(cell.ind)]) + ' )'); //the x translation is taken care of by the group this cell is nested in.
        });
        d.ind = sortedIndexes.indexOf(d.ind);
        //translate tableGroup to make room for the slope lines.
        select('#tableGroup')
            .transition(t2)
            .attr('transform', function (cell) {
            return ('translate(' + Config.slopeChartWidth + ' ,0)');
        });
        select('#tableHeaders')
            .transition(t2)
            .attr('transform', function (cell) {
            return ('translate(' + (560 + Config.slopeChartWidth) + ' ,0)');
        });
        select('#colSummaries')
            .transition(t2)
            .attr('transform', function (cell) {
            return ('translate(' + (560 + Config.slopeChartWidth) + ' ,15)');
        });
        selectAll('.slopeLine')
            .transition(t2)
            .attr('d', function (d) {
            return _this.slopeChart({ y: d.y, ind: sortedIndexes.indexOf(d.ind), width: Config.slopeChartWidth });
        });
        select('#tableGroup')
            .selectAll('.highlightBar')
            .transition(t2)
            .attr('y', function (d) {
            return _this.y(_this.rowOrder[sortedIndexes.indexOf(d.i)]);
        });
    };
    /**
     *
     * This function adds the 'sorting' glyphs to the top of the columns in the table.
     *
     * @param element d3 selection of the current column header element.
     * @param cellData the data bound to the column header element being passed in.
     */
    attributeTable.prototype.addSortingIcons = function (element, cellData) {
        var _this = this;
        var icon = element.selectAll('.descending')
            .data([cellData]);
        var iconEnter = icon.enter()
            .append('text')
            .classed('sortIcon', true)
            .classed('descending', true);
        icon = iconEnter.merge(icon);
        icon
            .text('\uf0dd')
            .attr('y', this.rowHeight * 1.8 + 20)
            .attr('x', function (d) {
            return _this.colWidths[d.type] / 2 - 5;
        });
        icon = element.selectAll('.ascending')
            .data([cellData]);
        iconEnter = icon.enter()
            .append('text')
            .classed('sortIcon', true)
            .classed('ascending', true);
        icon = iconEnter.merge(icon);
        icon
            .attr('font-family', 'FontAwesome')
            .text('\uf0de')
            .attr('y', this.rowHeight * 1.8 + 30)
            .attr('x', function (d) {
            return _this.colWidths[cellData.type] / 2 + 5;
        });
        element.selectAll('.sortIcon')
            .attr('font-family', 'FontAwesome')
            .attr('font-size', 17)
            .attr('text-anchor', 'middle');
        var self = this;
        selectAll('.sortIcon')
            .on('click', function (d) {
            // Set 'sortAttribute'
            if (select(this).classed('ascending')) {
                self.sortAttribute.state = sortedState.Ascending;
            }
            else {
                self.sortAttribute.state = sortedState.Descending;
            }
            self.sortAttribute.data = d;
            selectAll('.sortIcon')
                .classed('sortSelected', false);
            select(this)
                .classed('sortSelected', true);
            self.sortRows(d, self.sortAttribute.state);
        });
    };
    /**
     *
     * This function renders the column header of String columns in the Table View.
     *
     * @param element d3 selection of the current column header element.
     * @param cellData the data bound to the column header element being passed in.
     */
    attributeTable.prototype.renderStringHeader = function (element, headerData) {
        element.selectAll('rect').remove();
        element.selectAll('text').remove();
        element.selectAll('circle').remove();
        this.addSortingIcons(element, headerData);
    };
    ;
    /**
     *
     * This function renders the column header of String columns in the Table View.
     *
     * @param element d3 selection of the current column header element.
     * @param cellData the data bound to the column header element being passed in.
     */
    attributeTable.prototype.renderIDHeader = function (element, headerData) {
        element.selectAll('rect').remove();
        element.selectAll('text').remove();
        element.selectAll('circle').remove();
        this.addSortingIcons(element, headerData);
    };
    ;
    /**
     *
     * This function renders the column header of Categorical columns in the Table View.
     *
     * @param element d3 selection of the current column header element.
     * @param cellData the data bound to the column header element being passed in.
     */
    attributeTable.prototype.renderCategoricalHeader = function (element, headerData) {
        var _this = this;
        var col_width = this.colWidths.categorical;
        var height = this.rowHeight * 1.8;
        var numPositiveValues = headerData.data.map(function (singleRow) {
            return singleRow.reduce(function (a, v) {
                return v === headerData.category ? a + 1 : a;
            }, 0);
        }).reduce(function (a, v) {
            return v + a;
        }, 0);
        var totalValues = headerData.data.map(function (singleRow) {
            return singleRow.length;
        }).reduce(function (a, v) {
            return a + v;
        }, 0);
        var summaryScale = scaleLinear().range([0, height]).domain([0, totalValues]);
        if (element.selectAll('.histogram').size() === 0) {
            element.append('rect')
                .classed('histogram', true);
            element.append('text')
                .classed('histogramLabel', true);
        }
        this.addSortingIcons(element, headerData);
        element.select('.histogram')
            .attr('opacity', 0)
            .attr('width', col_width)
            .attr('height', summaryScale(numPositiveValues))
            .attr('y', (height - summaryScale(numPositiveValues)))
            .attr('opacity', 1)
            .attr('fill', function () {
            var attr = _this.tableManager.primaryAttribute;
            if (attr && attr.name === headerData.name) {
                var index = attr.categories.indexOf(headerData.category);
                return attr.color[index];
            }
            else {
                attr = _this.tableManager.affectedState;
                if (attr) {
                    var poi = attr;
                    attr = attr.attributeInfo;
                    if (attr.name === headerData.name) {
                        if (poi.isAffected(headerData.category)) {
                            var index = attr.categories.indexOf(headerData.category);
                            return attr.color[index];
                        }
                    }
                }
            }
        });
        element.select('.histogramLabel')
            .attr('opacity', 0)
            .text(function () {
            var percentage = (numPositiveValues / totalValues * 100);
            if (percentage < 1) {
                return percentage.toFixed(1) + '%';
            }
            else {
                return percentage.toFixed(0) + '%';
            }
        })
            .attr('y', (height - summaryScale(numPositiveValues) - 2))
            .attr('opacity', 1);
    };
    ;
    /**
     *
     * This function renders the column header of Quantitative columns as Histograms
     *
     * @param element d3 selection of the current column header element.
     * @param cellData the data bound to the column header element being passed in.
     */
    attributeTable.prototype.renderIntHeaderHist = function (element, headerData) {
        // let t = transition('t').duration(500).ease(easeLinear);
        var _this = this;
        var col_width = this.colWidths.int;
        var height = this.rowHeight * 1.8;
        var hist = headerData.hist;
        var range = [0, col_width];
        // var data = [],
        // cols = scaleLinear<string,string>().domain([hist.largestFrequency, 0]).range(['#111111', '#999999']),
        var total = hist.validCount, binWidth = (range[1] - range[0]) / hist.bins, acc = 0;
        var data = [];
        hist.forEach(function (b, i) {
            data[i] = {
                v: b,
                acc: acc,
                ratio: b / total,
                range: hist.range(i),
            };
            acc += b;
        });
        var xScale = scaleLinear().range([0, col_width]).domain(hist.valueRange).nice();
        var bin2value = scaleLinear().range(hist.valueRange).domain([0, hist.bins]);
        var yScale = scaleLinear().range([0, height * 0.8]).domain([0, max(data, function (d) {
                return d.v;
            })]);
        var xAxis = axisBottom(xScale)
            .tickSize(5)
            .tickValues(xScale.domain())
            .tickFormat(format('.0f'));
        var bars = element.selectAll('.histogram')
            .data(data);
        var barsEnter = bars.enter();
        barsEnter
            .append('rect')
            .classed('histogram', true);
        bars.exit().remove();
        //bars = barsEnter.merge(bars);
        if (element.selectAll('.hist xscale').size() === 0) {
            element.append('text').classed('maxValue', true);
            element.append('g')
                .attr('transform', 'translate(0,' + height + ')')
                .classed('hist_xscale', true)
                .call(xAxis);
        }
        this.addSortingIcons(element, headerData);
        element.selectAll('.histogram')
            .attr('width', binWidth * 0.8)
            .attr('height', function (d) {
            return yScale(d.v);
        })
            .attr('y', function (d) {
            return (height - yScale(d.v));
        })
            .attr('x', function (d, i) {
            return xScale(bin2value(i));
        })
            .attr('fill', function () {
            var attr = _this.tableManager.primaryAttribute;
            if (attr && attr.name === headerData.name) {
                return attr.color;
            }
            else {
                attr = _this.tableManager.affectedState;
                if (attr && attr.attributeInfo.name === headerData.name) {
                    return attr.attributeInfo.color;
                }
            }
        });
        //Position tick labels to be 'inside' the axis bounds. avoid overlap
        element.selectAll('.tick').each(function (cell) {
            var xtranslate = +select(this).attr('transform').split('translate(')[1].split(',')[0];
            if (xtranslate === 0)
                select(this).select('text').style('text-anchor', 'start');
            else {
                select(this).select('text').style('text-anchor', 'end');
            }
        });
        total = (data[data.length - 1]).acc + (data[data.length - 1]).v;
        element.select('.maxValue')
            .text('Total:' + total)
            .attr('x', col_width / 2)
            .attr('y', -height * 0.1)
            .attr('text-anchor', 'middle');
    };
    ;
    /**
     *
     * This function renders the content of Categorical Cells in the Table View.
     *
     * @param element d3 selection of the current cell element.
     * @param cellData the data bound to the cell element being passed in.
     */
    attributeTable.prototype.renderCategoricalCell = function (element, cellData) {
        // let t = transition('t').duration(500).ease(easeLinear);
        var _this = this;
        var col_width = this.colWidths.categorical;
        var rowHeight = this.rowHeight;
        //Add up the undefined values;
        var numValidValues = cellData.data.reduce(function (a, v) {
            return v ? a + 1 : a;
        }, 0);
        var numValues = cellData.data.filter(function (c) {
            return (c === cellData.category);
        }).length;
        element.selectAll('rect').remove(); //Hack. don't know why the height of the rects isn' being updated.
        if (numValidValues < 1) {
            //Add a faint cross out to indicate no data here;
            if (element.selectAll('.cross_out').size() === 0) {
                element
                    .append('line')
                    .attr('class', 'cross_out');
            }
            element.select('.cross_out')
                .attr('x1', col_width * 0.3)
                .attr('y1', rowHeight / 2)
                .attr('x2', col_width * 0.6)
                .attr('y2', rowHeight / 2)
                .attr('stroke-width', 2)
                .attr('stroke', '#9e9d9b')
                .attr('opacity', .6);
            return;
        }
        if (element.selectAll('.categorical').size() === 0) {
            element
                .append('rect')
                .classed('frame', true);
            element.append('rect')
                .classed(VALUE_TYPE_CATEGORICAL, true);
        }
        this.yScale
            .domain([0, cellData.data.length])
            .range([0, rowHeight]);
        element
            .select('.frame')
            .attr('width', rowHeight)
            .attr('height', rowHeight)
            .attr('y', 0)
            .attr('fill', function (d) {
            var attr;
            var primary = _this.tableManager.primaryAttribute;
            var poi = _this.tableManager.affectedState;
            if (primary && primary.name === cellData.varName) {
                attr = primary;
            }
            else if (poi && poi.name === cellData.varName) {
                attr = poi;
                attr = attr.attributeInfo;
            }
            if (attr) {
                var ind = attr.categories.indexOf(cellData.category);
                if ((poi && poi.name === cellData.varName && poi.isAffected(cellData.data[0])) || (primary && primary.name === cellData.varName)) {
                    if (ind === 0) {
                        return attr.color[1];
                    }
                    else {
                        return attr.color[0];
                    }
                }
                ;
            }
            return '#dfdfdf';
        });
        element
            .select('.categorical')
            .attr('width', rowHeight)
            .attr('height', this.yScale(numValues))
            .attr('y', (rowHeight - this.yScale(numValues)))
            .classed('aggregate', function () {
            return cellData.data.length > 1;
        })
            .attr('fill', function () {
            var attr;
            var primary = _this.tableManager.primaryAttribute;
            var poi = _this.tableManager.affectedState;
            if (primary && primary.name === cellData.varName) {
                attr = primary;
            }
            else if (poi && poi.name === cellData.varName) {
                attr = poi;
                attr = attr.attributeInfo;
            }
            if (attr) {
                var ind = attr.categories.indexOf(cellData.category);
                if (ind > -1) {
                    if ((poi && poi.name === cellData.varName && poi.isAffected(cellData.data[0])) || (primary && primary.name === cellData.varName)) {
                        return attr.color[ind];
                    }
                    ;
                }
            }
            return '#767a7a';
        });
    };
    /**
     *
     * This function renders the content of Categorical Cells in the Table View.
     *
     * @param element d3 selection of the current cell element.
     * @param cellData the data bound to the cell element being passed in.
     */
    attributeTable.prototype.renderDataDensCell = function (element, cellData) {
        var col_width = this.colWidths[cellData.type];
        var rowHeight = this.rowHeight;
        if (element.selectAll('.dataDens').size() === 0) {
            element
                .append('rect')
                .classed('dataDens', true);
            element.append('text')
                .classed('label', true);
        }
        var colorScale = scaleLinear().domain(this.idScale.domain()).range(["#c0bfbb", "#373838"]);
        element
            .select('.dataDens')
            .attr('width', col_width)
            .attr('height', rowHeight)
            .attr('y', 0)
            .attr('fill', function (d) {
            return cellData.type === 'idtype' ? '#c0bfbb' : colorScale(cellData.data); //return a single color for idtype cols.
        });
        element
            .select('.label')
            .attr('x', col_width / 2)
            .attr('y', rowHeight * 0.8)
            .text(function () {
            return cellData.data;
            // return (+cellData.data >1 ? cellData.data : '')
        })
            .attr('text-anchor', 'middle');
    };
    attributeTable.prototype.renderFamilyIDCell = function (element, cellData) {
        var equalValues = cellData.data.reduce(function (a, b) {
            return (a === b) ? a : NaN;
        }); //check for array that has all equal values in an aggregate (such as KindredId);
        if (isNaN(equalValues)) {
            console.log('Found Duplicate KindredIDs in aggregate row!');
            return;
        }
        cellData.data = equalValues; //set the value of this cell as the KindredID
        this.renderDataDensCell(element, cellData);
    };
    /**
     *
     * This function renders the content of Quantitative (type === int)  Cells in the Table View.
     *
     * @param element d3 selection of the current cell element.
     * @param cellData the data bound to the cell element being passed in.
     */
    attributeTable.prototype.renderIntCell = function (element, cellData) {
        var _this = this;
        var col_width = this.colWidths.int; //this.getDisplayedColumnWidths(this.width).find(x => x.name === cellData.name).width
        var rowHeight = this.rowHeight;
        var radius = 3.5;
        var jitterScale = scaleLinear()
            .domain([0, 1])
            .range([rowHeight * 0.3, rowHeight * 0.7]);
        this.xScale
            .domain(cellData.vector.desc.value.range)
            .range([col_width * 0.1, col_width * 0.9])
            .clamp(true);
        //No of non-undefined elements in this array
        var numValues = cellData.data.reduce(function (a, v) { return v ? a + 1 : a; }, 0);
        if (numValues === 0) {
            //Add a faint cross out to indicate no data here;
            if (element.selectAll('.cross_out').size() === 0) {
                element
                    .append('line')
                    .attr('class', 'cross_out');
            }
            element.select('.cross_out')
                .attr('x1', col_width * 0.3)
                .attr('y1', rowHeight / 2)
                .attr('x2', col_width * 0.6)
                .attr('y2', rowHeight / 2)
                .attr('stroke-width', 2)
                .attr('stroke', '#9e9d9b')
                .attr('opacity', .6);
            return;
        }
        if (element.selectAll('.quant').size() === 0) {
            element
                .append('rect')
                .classed('quant', true);
        }
        element
            .select('.quant')
            .attr('width', function (d) {
            return col_width;
        })
            .attr('height', rowHeight);
        // .attr('stroke', 'black')
        // .attr('stoke-width', 1);
        element.selectAll('.quant_ellipse').remove(); //Hack. don't know why ellipsis.exit().remove() isn' removing the extra ones.
        var ellipses = element
            .selectAll('ellipse')
            .data(function (d) {
            var cellArray = cellData.data.filter(function (f) {
                return !isNaN(f) && !isNullOrUndefined((f));
            })
                .map(function (e, i) {
                return { 'id': d.id[i], 'name': d.name, 'stats': d.stats, 'value': e };
            });
            return cellArray;
        });
        var ellipsesEnter = ellipses.enter()
            .append('ellipse')
            .classed('quant_ellipse', true);
        ellipses = ellipsesEnter.merge(ellipses);
        ellipses.exit().remove(); //Dont'know why these is not removing ellipses. :-/
        element.selectAll('.quant_ellipse')
            .attr('cx', function (d) {
            if (!isNaN(d.value)) {
                return _this.xScale(d.value);
            }
            ;
        })
            .attr('cy', function () {
            return numValues > 1 ? jitterScale(Math.random()) : rowHeight / 2;
        }) //introduce jitter in the y position for multiple ellipses.
            .attr('rx', radius)
            .attr('ry', radius)
            .attr('fill', function () {
            var attr, ind;
            var primary = _this.tableManager.primaryAttribute;
            var poi = _this.tableManager.affectedState;
            if (primary && primary.name === cellData.varName) {
                attr = primary;
            }
            else if (poi && poi.name === cellData.varName) {
                attr = poi;
                attr = attr.attributeInfo;
            }
            if ((poi && poi.name === cellData.varName && poi.isAffected(cellData.data[0])) || (primary && primary.name === cellData.varName)) {
                return attr.color;
            }
            ;
        });
    };
    /**
     *
     * This function renders the content of String Cells in the Table View.
     *
     * @param element d3 selection of the current cell element.
     * @param cellData the data bound to the cell element being passed in.
     */
    attributeTable.prototype.renderStringCell = function (element, cellData) {
        var col_width = this.colWidths[cellData.type];
        var rowHeight = this.rowHeight;
        var numValues = cellData.data.reduce(function (a, v) { return v ? a + 1 : a; }, 0);
        if (numValues === 0) {
            return;
        }
        if (element.selectAll('.string').size() === 0) {
            element
                .append('text')
                .classed('string', true);
        }
        var textLabel;
        if (cellData.data.length === 0 || cellData.data[0] === undefined) {
            textLabel = '';
        }
        else {
            textLabel = cellData.data[0].toLowerCase().slice(0, 12);
            if (cellData.data[0].length > 12) {
                textLabel = textLabel.concat(['...']);
            }
            if (numValues > 1) {
                textLabel = '...';
            }
        }
        element
            .select('.string')
            .text(textLabel)
            .attr('dy', rowHeight * 0.9)
            .style('stroke', 'none');
        //set Hover to show entire text
        element
            .on('mouseover', function (d) {
            select(this).select('.string')
                .text(function () {
                if (d.data.length === 1)
                    return d.data[0].toLowerCase();
                else
                    return 'Multiple';
            });
        })
            .on('mouseout', function (d) {
            var textLabel = cellData.data[0].toLowerCase().slice(0, 12);
            if (cellData.data[0].length > 12) {
                textLabel = textLabel.concat(['...']);
            }
            if (numValues > 1) {
                textLabel = '...';
            }
            select(this).select('.string').text(textLabel);
        });
    };
    /**
     *
     * This function renders the content of ID Cells in the Table View.
     *
     * @param element d3 selection of the current cell element.
     * @param cellData the data bound to the cell element being passed in.
     */
    attributeTable.prototype.renderIdCell = function (element, cellData) {
        var col_width = this.colWidths[cellData.type];
        var rowHeight = this.rowHeight;
        this.idScale.range([0, col_width * 0.6]);
        var numValues = cellData.data.reduce(function (a, v) { return v ? a + 1 : a; }, 0);
        var equalValues = cellData.data.reduce(function (a, b) {
            return (a === b) ? a : NaN;
        }); //check for array that has all equal values in an aggregate (such as KindredId)
        if (numValues === 0) {
            return;
        }
        if (numValues > 1 && element.select('.idBar').size() === 0) {
            element
                .append('rect')
                .classed('idBar', true);
        }
        if (numValues === 1) {
            element.select('rect').remove();
        }
        if (element.selectAll('.string').size() === 0) {
            element
                .append('text')
                .classed('string', true);
        }
        var textLabel;
        if (numValues === 1 || !isNaN(equalValues)) {
            textLabel = '#' + cellData.data[0];
            element
                .select('.string')
                .text(textLabel)
                .attr('dy', rowHeight * 0.9)
                .attr('dx', 0)
                .style('stroke', 'none');
        }
        else {
            element
                .select('.string')
                .text('...')
                .attr('dy', rowHeight * 0.9)
                .style('stroke', 'none');
        }
        // element.selectAll('text')
        //   .attr('dx', col_width/2)
        //   .attr('text-anchor','middle')
    };
    attributeTable.prototype.slopeChart = function (d) {
        var slopeWidth = d.width;
        var nx = slopeWidth * 0.2;
        var width = slopeWidth;
        var linedata = [{
                x: 0,
                y: this.y(d.y) + (this.rowHeight / 2)
            },
            {
                x: nx,
                y: this.y(d.y) + (this.rowHeight / 2)
            },
            {
                x: width - nx,
                y: this.y(this.rowOrder[d.ind]) + (this.rowHeight / 2)
            },
            {
                x: width,
                y: this.y(this.rowOrder[d.ind]) + (this.rowHeight / 2)
            }];
        return this.lineFunction(linedata);
    };
    //
    //     // stick on the median
    //     quantitative
    //       .append('rect') //sneaky line is a rectangle
    //       .attr('class', 'medianLine');
    //
    //     cells
    //       .selectAll('.medianLine')
    //       .attr('width', 1.2)
    //       .attr('height', rowHeight)
    //       .attr('fill', 'black')
    //       .attr('transform', function (d) {
    //         const width = col_widths.find(x => x.name === d.name).width;
    //         const scaledRange = (width - 2 * radius) / (d.stats.max - d.stats.min);
    //         return ('translate(' + ((d.stats.mean - d.stats.min) * scaledRange) + ',0)');
    //       });
    //     cells.selectAll('rect').on('click',(c) => {console.log(c);})
    //
    //
    // ////////////// EVENT HANDLERS! /////////////////////////////////////////////
    //
    //     const jankyAData = this.tableManager; ///auuughhh javascript why
    //     const jankyInitHandle = this.initData; ///whywhywhywhy
    //     let self = this;
    //
    //     cells.on('click', async function (elem) {
    //       //  console.log('REGISTERED CLICK');
    //       //update the dataset & re-render
    //
    //       // const newView = await jankyAData.anniesTestUpdate();
    //       // self.update(newView, [1, 2]);
    //       // console.log('NEW VIEW!');
    //       // console.log(newView.cols()[0]);
    //
    //     });
    //
    //
    //     //  cells.on('click', function(elem) {
    //     //    selectAll('.boundary').classed('tablehovered', false);
    //     //    if (!event.metaKey){ //unless we pressed shift, unselect everything
    //     //      selectAll('.boundary').classed('tableselected',false);
    //     //    }
    //     //    selectAll('.boundary')
    //     //     .classed('tableselected', function(){
    //     //        const rightRow = (parseInt(select(this).attr('row_pos')) === elem['y']);
    //     //        if(rightRow){
    //     //           return (!select(this).classed('tableselected')); //toggle it
    //     //         }
    //     //        return select(this).classed('tableselected'); //leave it be
    //     //      });
    //     //    if(event.metaKey)
    //     //       events.fire('table_row_selected', elem['y'], 'multiple');
    //     //    else
    //     //       events.fire('table_row_selected', elem['y'], 'singular');
    //     //    })
    //     //    // MOUSE ON
    //     //    .on('mouseover', function(elem) {
    //     //       selectAll('.boundary').classed('tablehovered', function(){
    //     //         const rightRow = (select(this).attr('row_pos') == elem['y']); //== OR parseInt. Not sure which is more canonical.
    //     //         if(rightRow){ //don't hover if it's selected
    //     //           return !select(this).classed('tableselected');
    //     //         }
    //     //         return false; //otherwise don't hover
    //     //    });
    //     //    events.fire('table_row_hover_on', elem['y']);
    //     //    })
    //     //    // MOUSE OFF
    //     //    .on('mouseout', function(elem) {
    //     //      selectAll('.boundary').classed('tablehovered', false);
    //     //      events.fire('table_row_hover_off', elem['y']);
    //     //    });
    //
    //     console.log('done rendering')
    //
    //   }
    //private update(data){
    //}
    attributeTable.prototype.attachListener = function () {
        // //NODE BEGIN HOVER
        // events.on('row_mouseover', (evt, item) => {
        //   let cell = selectAll('.cell').filter((d:any)=> {return d.y === item}).select('.boundary')
        //     // .classed('tablehovered', function (d: any) {return (d.y === item);});
        //     .classed('tablehovered', true);
        // });
        //
        // //NODE END HOVER
        // events.on('row_mouseout', (evt, item) => {
        //   return selectAll('.boundary').classed('tablehovered', false);
        // });
        var self = this;
        //
        // events.on('redraw_tree', () => {
        //   console.log(' redraw_tree calling self.update()')
        //   self.update();
        //
        // });
        events.on(TABLE_VIS_ROWS_CHANGED_EVENT, function () {
            self.update();
        });
        events.on(PRIMARY_SELECTED, function (evt, item) {
            self.render();
        });
        events.on(POI_SELECTED, function (evt, item) {
            self.render();
        });
        events.on(COL_ORDER_CHANGED_EVENT, function (evt, item) {
            self.update();
        });
    };
    return attributeTable;
}());
/**
 * Factory method to create a new instance of the Table
 * @param parent
 * @param options
 * @returns {attributeTable}
 */
export function create(parent) {
    return new attributeTable(parent);
}
//# sourceMappingURL=attributeTable.js.map