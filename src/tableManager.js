import * as tslib_1 from "tslib";
import { get as getById } from 'phovea_core/src/data';
import { VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL, VALUE_TYPE_STRING } from 'phovea_core/src/datatype';
import * as range from 'phovea_core/src/range';
import * as events from 'phovea_core/src/event';
import { transition } from 'd3-transition';
import { easeLinear } from 'd3-ease';
import { isUndefined } from 'util';
//Create new type that encompasses both types of primary attributes
//export type attribute = IPrimaryCatAttribute | IPrimaryQuantAttribute;
var indexOfKindredIDColumn = 1;
export var VIEW_CHANGED_EVENT = 'view_changed_event';
export var TABLE_VIS_ROWS_CHANGED_EVENT = 'table_vis_rows_changed_event';
export var PRIMARY_SELECTED = 'primary_secondary_attribute_event';
export var POI_SELECTED = 'affected_attribute_event';
export var FAMILY_INFO_UPDATED = 'family_stats_updated';
export var COL_ORDER_CHANGED_EVENT = 'col_ordering_changed';
export var FAMILY_SELECTED_EVENT = 'family_selected_event';
export var UPDATE_TABLE_EVENT = 'update_table';
// export const PRIMARY_COLOR = '#335b8e';
// export const PRIMARY_COLOR_2 = '#b5b867';
//
// export const SECONDARY_COLOR = '#9f295d';
// export const SECONDARY_COLOR_2 = '#e7a396';
//
// export const PRIMARY_CATEGORICAL_COLORS = ['#b5b867', '#ffea59', '#b7dbdb', '#335b8e', '#6ca18f'];
// export const SECONDARY_CATEGORICAL_COLORS = ['#e7a396', '#9f295d', '#d9a34b', '#ecd1ca', '#430e00']; //
//
export var POI_COLOR = '#285880';
export var POI_COLOR_2 = '#49aaf3';
export var PRIMARY_COLOR = '#598e7c';
export var PRIMARY_COLOR_2 = '#b5b867';
export var PRIMARY_COLOR_3 = '#9f0e72';
export var PRIMARY_COLOR_4 = '#e7a396';
export var PRIMARY_COLOR_5 = '#882c00';
export var PRIMARY_COLOR_6 = '#B7DBDB';
// export const PRIMARY_COLOR_7 = '#337CAF';
export var PRIMARY_CATEGORICAL_COLORS = [PRIMARY_COLOR, PRIMARY_COLOR_2, PRIMARY_COLOR_3, PRIMARY_COLOR_4, PRIMARY_COLOR_5, PRIMARY_COLOR_6];
/**
 * This class manages the data structure for the graph, the table visualization and the attribute selection panel.
 */
var TableManager = (function () {
    function TableManager() {
        /** The columns currently displayed in the table */
        this.activeTableColumns = range.all(); //default value;
        /** The rows currently shown in the table, a subset of the activeGraphRows */
        this._activeTableRows = range.all(); //default value;
        /** All rows that are used in the graph - corresponds to a family */
        this._activeGraphRows = range.all();
        /** The columns currently displayed in the graph  */
        this.activeGraphColumns = range.all(); //default value
        // private defaultCols: String[] =
        //   ['KindredID','PersonID', 'Asthma', 'Bipolar', 'sex', 'deceased', 'suicide', 'gen', 'Age', 'FirstBMI', 'AgeFirstBMI', 'race', 'cause_death', 'weapon']; //set of default cols to read in, minimizes load time for large files;
        this.defaultCols = ['KindredID', 'RelativeID', 'sex', 'deceased', 'suicide', 'Depression', 'Age', 'Age1D_Depression', 'Nr.Diag_Depression', 'Bipolar', 'Age1D_Bipolar', 'Nr.Diag_Bipolar', 'MaxBMI', 'AgeMaxBMI', 'race', 'cause_death', 'weapon']; //set of default cols to read in, minimizes load time for large files;
        /** Basic information about all the loaded families */
        this.familyInfo = [];
        this.t = transition('t').duration(600).ease(easeLinear);
    }
    /**
     * Loads the graph data and the attribute data from the server and stores it in the public table variable
     * Parses out the familySpecific information to populate the Family Selector
     * @param: id of the dataset
     */
    TableManager.prototype.loadData = function (descendDataSetID, attributeDataSetID) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        //retrieving the desired dataset by name
                        _a = this;
                        return [4 /*yield*/, getById(attributeDataSetID)];
                    case 1:
                        //retrieving the desired dataset by name
                        _a.attributeTable = (_c.sent());
                        return [4 /*yield*/, this.parseAttributeData()];
                    case 2:
                        _c.sent();
                        //retrieving the desired dataset by name
                        _b = this;
                        return [4 /*yield*/, getById(descendDataSetID)];
                    case 3:
                        //retrieving the desired dataset by name
                        _b.table = (_c.sent());
                        return [4 /*yield*/, this.parseFamilyInfo()];
                    case 4:
                        _c.sent(); //this needs to come first because the setAffectedState sets default values based on the data for a selected family.
                        // await this.setAffectedState('suicide'); //Default value;
                        // await this.updateFamilyStats();
                        //For panel attribute add/remove/ordering
                        this.attachListeners();
                        return [2 /*return*/, Promise.resolve(this)];
                }
            });
        });
    };
    /**
     *
     * This function get the requested attribute for the person requested if the attribute is a POI, primary, or secondary.
     * Returns undefined if there is no value.
     *
     * @param attribute - attribute to search for
     * @param personID - person for which to search for attribute
     */
    TableManager.prototype.getAttribute = function (attribute, personID) {
        var selectedAttribute;
        if (attribute === this.affectedState.name) {
            selectedAttribute = this.affectedState;
        }
        else if (this.primaryAttribute && attribute === this.primaryAttribute.name) {
            selectedAttribute = this.primaryAttribute;
        }
        else {
            console.log('neither POI nor primary');
            return undefined;
        }
        var ids = selectedAttribute.personIDs;
        if (ids.indexOf(personID) > -1) {
            var index = ids.indexOf(personID);
            var value = selectedAttribute.data[index];
            return value;
        }
        else {
            return undefined;
        }
    };
    /**
     *
     * This function get the requested attribute vector.
     *
     * @param attribute - attribute to search for
     * @param allFamilies - boolean set to true to return the attribute vector for all families. Defaults to false.
     */
    TableManager.prototype.getAttributeVector = function (attributeName, allFamilies) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allColumns, attributeVector;
            return tslib_1.__generator(this, function (_a) {
                if (allFamilies === undefined) {
                    allFamilies = false;
                }
                //Find Vector of that attribute in either table.
                if (this.graphTable && !allFamilies) {
                    allColumns = this.graphTable.cols().concat(this.tableTable.cols());
                }
                else {
                    allColumns = this.table.cols().concat(this.attributeTable.cols());
                }
                attributeVector = undefined;
                allColumns.forEach(function (col) {
                    if (col.desc.name === attributeName) {
                        attributeVector = col;
                    }
                });
                return [2 /*return*/, attributeVector];
            });
        });
    };
    TableManager.prototype.setPrimaryAttribute = function (attributeName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var binaryColorChoice1, binaryColorChoice2, multipleColorChoice, attributeVector, categories, color, allColumns, attributeDefinition, _a, _b, _c, data, categoricalDefinition, quantDefinition, _d;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        binaryColorChoice1 = PRIMARY_COLOR;
                        binaryColorChoice2 = PRIMARY_COLOR_2;
                        multipleColorChoice = PRIMARY_CATEGORICAL_COLORS;
                        allColumns = this.graphTable.cols().concat(this.tableTable.cols());
                        allColumns.forEach(function (col) {
                            if (col.desc.name === attributeName) {
                                attributeVector = col;
                            }
                        });
                        _a = {
                            name: attributeName, primary: true, type: attributeVector.valuetype.type
                        };
                        _b = 'data';
                        return [4 /*yield*/, attributeVector.data()];
                    case 1:
                        _a[_b] = _e.sent(),
                            _a['range'] = attributeVector.desc.value.range;
                        _c = 'personIDs';
                        return [4 /*yield*/, attributeVector.names()];
                    case 2:
                        attributeDefinition = (_a[_c] = (_e.sent()),
                            _a);
                        return [4 /*yield*/, attributeVector.data()];
                    case 3:
                        data = _e.sent();
                        if (!(attributeDefinition.type === VALUE_TYPE_CATEGORICAL)) return [3 /*break*/, 4];
                        categoricalDefinition = attributeDefinition;
                        categories = attributeVector.desc.value.categories.map(function (c) {
                            return c.name;
                        });
                        if (categories.length === 2) {
                            color = [binaryColorChoice2, binaryColorChoice1];
                        }
                        else {
                            color = multipleColorChoice.slice(0, categories.length); //extract one color per category;
                        }
                        categoricalDefinition.categories = categories;
                        categoricalDefinition.color = color;
                        return [3 /*break*/, 6];
                    case 4:
                        if (!(attributeDefinition.type === VALUE_TYPE_INT || attributeDefinition.type === VALUE_TYPE_REAL)) return [3 /*break*/, 6];
                        quantDefinition = attributeDefinition;
                        _d = quantDefinition;
                        return [4 /*yield*/, attributeVector.stats()];
                    case 5:
                        _d.stats = _e.sent();
                        quantDefinition.color = binaryColorChoice1;
                        _e.label = 6;
                    case 6:
                        this.primaryAttribute = attributeDefinition;
                        events.fire(PRIMARY_SELECTED, attributeDefinition);
                        return [2 /*return*/, attributeDefinition]; //used by the attribute Panel to set the appropriate colors;
                }
            });
        });
    };
    /**
     * This function updates the data and ids for the affected State (POI) and primary attribute when a different family is selected.
     *
     */
    TableManager.prototype.updatePOI_Primary = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var attributeVector, varType, _a, _b, attributeVector, varType, _c, _d;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.affectedState) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getAttributeVector(this.affectedState.name)];
                    case 1:
                        attributeVector = _e.sent();
                        varType = attributeVector.valuetype.type;
                        _a = this.affectedState;
                        return [4 /*yield*/, attributeVector.data()];
                    case 2:
                        _a.data = _e.sent();
                        _b = this.affectedState;
                        return [4 /*yield*/, attributeVector.names()];
                    case 3:
                        _b.personIDs = (_e.sent());
                        _e.label = 4;
                    case 4:
                        if (!this.primaryAttribute) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getAttributeVector(this.primaryAttribute.name)];
                    case 5:
                        attributeVector = _e.sent();
                        varType = attributeVector.valuetype.type;
                        _c = this.primaryAttribute;
                        return [4 /*yield*/, attributeVector.data()];
                    case 6:
                        _c.data = _e.sent();
                        _d = this.primaryAttribute;
                        return [4 /*yield*/, attributeVector.names()];
                    case 7:
                        _d.personIDs = (_e.sent());
                        _e.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *
     * This function sets the affected State.
     *
     */
    TableManager.prototype.setAffectedState = function (varName, isAffectedCallbackFcn) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var attributeVector, varType, threshold, stats_1, categoriesVec, categories_1, category_1, data, personIDs, binaryColorChoice1, binaryColorChoice2, multipleColorChoice, categories, color, attributeDefinition, _a, _b, categoricalDefinition, quantDefinition, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getAttributeVector(varName, true)];
                    case 1:
                        attributeVector = _d.sent();
                        varType = attributeVector.valuetype.type;
                        if (!(typeof isAffectedCallbackFcn === 'undefined')) return [3 /*break*/, 4];
                        if (!(varType === VALUE_TYPE_INT || varType === VALUE_TYPE_REAL)) return [3 /*break*/, 3];
                        return [4 /*yield*/, attributeVector.stats()];
                    case 2:
                        stats_1 = _d.sent();
                        isAffectedCallbackFcn = function (attr) {
                            return attr >= stats_1.mean;
                        }; //if threshold hasn't been defined, default to anything over the mean value
                        threshold = stats_1.mean;
                        if (threshold > attributeVector.desc.value.range[1]) {
                            threshold = (attributeVector.desc.value.range[1] - attributeVector.desc.value.range[0]) / 2 + attributeVector.desc.value.range[0];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        if (varType === VALUE_TYPE_CATEGORICAL) {
                            categoriesVec = attributeVector.valuetype.categories;
                            categories_1 = categoriesVec.map(function (c) {
                                return c.name;
                            });
                            if (categories_1.find(function (d) {
                                return d === 'Y';
                            })) {
                                category_1 = 'Y';
                            }
                            else if (categories_1.find(function (d) {
                                return (d === 'TRUE' || d === 'True');
                            })) {
                                category_1 = 'TRUE';
                            }
                            else if (categories_1.find(function (d) {
                                return d === 'F';
                            })) {
                                category_1 = 'F';
                            }
                            else {
                                category_1 = categories_1[0];
                            }
                            isAffectedCallbackFcn = function (attr) {
                                return !isUndefined(attr) && attr.toLowerCase() === category_1.toLowerCase(); //solve the True/TRUE problem once and for all.
                            };
                            threshold = category_1;
                        }
                        else if (varType === VALUE_TYPE_STRING) {
                            isAffectedCallbackFcn = function (attr) {
                                return attr !== undefined && attr.length > 0;
                            }; //string is non empty
                        }
                        _d.label = 4;
                    case 4: return [4 /*yield*/, attributeVector.data()];
                    case 5:
                        data = _d.sent();
                        return [4 /*yield*/, attributeVector.names()];
                    case 6:
                        personIDs = (_d.sent());
                        binaryColorChoice1 = POI_COLOR;
                        binaryColorChoice2 = POI_COLOR;
                        multipleColorChoice = [POI_COLOR, POI_COLOR, POI_COLOR, POI_COLOR, POI_COLOR, POI_COLOR];
                        _a = {
                            name: varName, primary: false, type: varType,
                            'data': data, 'range': attributeVector.desc.value.range
                        };
                        _b = 'personIDs';
                        return [4 /*yield*/, attributeVector.names()];
                    case 7:
                        attributeDefinition = (_a[_b] = (_d.sent()),
                            _a);
                        if (!(attributeDefinition.type === VALUE_TYPE_CATEGORICAL)) return [3 /*break*/, 8];
                        categoricalDefinition = attributeDefinition;
                        categories = attributeVector.desc.value.categories.map(function (c) {
                            return c.name;
                        });
                        if (categories.length === 2) {
                            color = [binaryColorChoice2, binaryColorChoice1];
                        }
                        else {
                            color = multipleColorChoice.slice(0, categories.length); //extract one color per category;
                        }
                        categoricalDefinition.categories = categories;
                        categoricalDefinition.color = color;
                        return [3 /*break*/, 10];
                    case 8:
                        if (!(attributeDefinition.type === VALUE_TYPE_INT || attributeDefinition.type === VALUE_TYPE_REAL)) return [3 /*break*/, 10];
                        quantDefinition = attributeDefinition;
                        _c = quantDefinition;
                        return [4 /*yield*/, attributeVector.stats()];
                    case 9:
                        _c.stats = _d.sent();
                        quantDefinition.color = binaryColorChoice1;
                        _d.label = 10;
                    case 10:
                        this.affectedState = ({
                            name: varName,
                            type: varType,
                            'isAffected': isAffectedCallbackFcn,
                            'data': data,
                            'personIDs': personIDs,
                            'attributeInfo': attributeDefinition
                        });
                        //if Primary Attribute was previously set to this same attribute, clear primary
                        if (this.primaryAttribute && this.primaryAttribute.name === this.affectedState.name) {
                            this.primaryAttribute = undefined;
                            events.fire(PRIMARY_SELECTED, undefined);
                        }
                        //Update family selector
                        this.updateFamilyStats();
                        events.fire(POI_SELECTED, this.affectedState);
                        return [2 /*return*/, { threshold: threshold, 'type': varType }];
                }
            });
        });
    };
    /**
     * This function changes the range of rows to display on the selected family.
     * @param chosenFamilyID the numeric value of the familyID, uses the first family ID when none is specified
     */
    TableManager.prototype.selectFamily = function (chosenFamilyIDs) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var family, familyRange, familyMembersRange, familyMembers, attributeMembersRange, attributeMembers, attributeRows;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('selectfamily was called');
                        // console.log('chosen Family ID is ', chosenFamilyIDs)
                        if (chosenFamilyIDs == null) {
                            chosenFamilyIDs = [this.familyInfo[0].id];
                        }
                        family = this.familyInfo.find(function (family) { return family.id === chosenFamilyIDs[0]; });
                        familyRange = range.list(family.range);
                        chosenFamilyIDs.forEach(function (id, i) {
                            var family = _this.familyInfo.find(function (family) {
                                return family.id === chosenFamilyIDs[i];
                            });
                            if (i > 0) {
                                familyRange = familyRange.union(range.list(family.range));
                            }
                        });
                        this._activeGraphRows = familyRange;
                        return [4 /*yield*/, this.refreshActiveGraphView()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.graphTable.col(0).ids()];
                    case 2:
                        familyMembersRange = _a.sent();
                        familyMembers = familyMembersRange.dim(0).asList();
                        return [4 /*yield*/, this.attributeTable.col(0).ids()];
                    case 3:
                        attributeMembersRange = _a.sent();
                        attributeMembers = attributeMembersRange.dim(0).asList();
                        attributeRows = [];
                        attributeMembers.forEach(function (member, i) {
                            if (familyMembers.indexOf(member) > -1) {
                                attributeRows.push(i);
                            }
                        });
                        this._activeTableRows = range.list(attributeRows);
                        return [4 /*yield*/, this.refreshActiveTableView()];
                    case 4:
                        _a.sent();
                        this.updatePOI_Primary();
                        events.fire(FAMILY_SELECTED_EVENT);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function calculates the number of affected people based on the current POI selected in the panel.
     */
    TableManager.prototype.updateFamilyStats = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            var attributeVector, kindredIDVector, familyIDs, peopleIDs, attributeData, attributePeople, uniqueFamilyIDs;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAttributeVector(this.affectedState.name, true)];
                    case 1:
                        attributeVector = _a.sent();
                        return [4 /*yield*/, this.getAttributeVector('KindredID', true)];
                    case 2:
                        kindredIDVector = _a.sent();
                        return [4 /*yield*/, kindredIDVector.data()];
                    case 3:
                        familyIDs = _a.sent();
                        return [4 /*yield*/, kindredIDVector.names()];
                    case 4:
                        peopleIDs = _a.sent();
                        return [4 /*yield*/, attributeVector.data()];
                    case 5:
                        attributeData = _a.sent();
                        return [4 /*yield*/, attributeVector.names()];
                    case 6:
                        attributePeople = _a.sent();
                        uniqueFamilyIDs = Array.from(new Set(familyIDs));
                        uniqueFamilyIDs.forEach(function (id, index) {
                            //Return people that are in this family and are affected
                            var affected = familyIDs.filter(function (d, i) {
                                //find person in attribute id;
                                var ind = attributePeople.indexOf(peopleIDs[i]);
                                return ind > -1 && d === id && _this.affectedState.isAffected(attributeData[ind]);
                            });
                            _this.familyInfo[index].affected = affected.length;
                        });
                        events.fire(FAMILY_INFO_UPDATED, this);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function is called after loadData.
     * This function populates needed variables for attribute table and attribute panel
     *
     */
    TableManager.prototype.parseAttributeData = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var columns, colIndexAccum;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.attributeTable.cols()];
                    case 1:
                        columns = _a.sent();
                        colIndexAccum = [];
                        //populate active attribute array
                        columns.forEach(function (col, i) {
                            var type = col.desc.value.type;
                            if (type !== 'idtype') {
                                colIndexAccum.push(i); //push the index so we can get the right view
                            }
                        });
                        this._activeTableRows = range.all();
                        this.activeTableColumns = range.list(colIndexAccum);
                        return [4 /*yield*/, this.refreshActiveTableView()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function is called after loadData.
     * This function populates needed variables for family selector
     *
     */
    TableManager.prototype.parseFamilyInfo = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var familyIDs, uniqueFamilyIDs, _loop_1, this_1, _i, uniqueFamilyIDs_1, id, columns, colIndexAccum;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.table.col(indexOfKindredIDColumn).data()];
                    case 1:
                        familyIDs = _a.sent();
                        uniqueFamilyIDs = Array.from(new Set(familyIDs));
                        _loop_1 = function (id) {
                            //Array to store the ranges for the selected family
                            var familyRange = [];
                            var affected = 0;
                            familyIDs.forEach(function (d, i) {
                                if (d === id) {
                                    familyRange.push(i);
                                }
                            });
                            this_1.familyInfo.push({ id: id, range: familyRange, size: familyRange.length, affected: affected });
                        };
                        this_1 = this;
                        for (_i = 0, uniqueFamilyIDs_1 = uniqueFamilyIDs; _i < uniqueFamilyIDs_1.length; _i++) {
                            id = uniqueFamilyIDs_1[_i];
                            _loop_1(id);
                        }
                        return [4 /*yield*/, this.table.cols()];
                    case 2:
                        columns = _a.sent();
                        colIndexAccum = [];
                        //populate active attribute array
                        columns.forEach(function (col, i) {
                            var type = col.desc.value.type;
                            // if (type !== 'idtype') {
                            colIndexAccum.push(i); //push the index so we can get the right view
                            // }
                        });
                        this.activeGraphColumns = range.list(colIndexAccum);
                        return [4 /*yield*/, this.refreshActiveGraphView()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.selectFamily()];
                    case 4:
                        _a.sent(); //call to selectFamily is now made from the familySelector object
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Uses the active rows and cols to create new table and graph tables and fires a {VIEW_CHANGED_EVENT} event when done.
     * @return {Promise<void>}
     */
    TableManager.prototype.refreshActiveViews = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refreshActiveTableView()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.refreshActiveGraphView()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Uses the active rows and cols to create new table view.
     * @return {Promise<void>}
     */
    TableManager.prototype.refreshActiveTableView = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableRange, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tableRange = range.join(this._activeTableRows, this.activeTableColumns);
                        _a = this;
                        return [4 /*yield*/, this.attributeTable.view(tableRange)];
                    case 1:
                        _a.tableTable = _b.sent(); //view on attribute table
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Uses the active rows and cols to create new graph view.
     * @return {Promise<void>}
     */
    TableManager.prototype.refreshActiveGraphView = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var graphRange, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        graphRange = range.join(this._activeGraphRows, this.activeGraphColumns);
                        _a = this;
                        return [4 /*yield*/, this.table.view(graphRange)];
                    case 1:
                        _a.graphTable = _b.sent(); //view on graph table
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(TableManager.prototype, "activeTableRows", {
        /**
         * Updates the active rows for the table visualization, creates a new table view and fires a {TABLE_VIS_ROWS_CHANGED} event.
         * @param newRows
         */
        set: function (newRows) {
            this._activeTableRows = newRows;
            this.tableTable = this.table.view(range.join(this._activeTableRows, this.activeTableColumns));
            console.log('firing TABLE VIS ROWS from activeTableRows');
            events.fire(TABLE_VIS_ROWS_CHANGED_EVENT);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TableManager.prototype, "activeGraphRows", {
        /**
         * Updates the active rows for the table visualization, creates a new table view and fires a {TABLE_VIS_ROWS_CHANGED} event.
         * @param newRows
         */
        set: function (newRows) {
            var _this = this;
            this.table.col(0).ids().then(function (allIDsRange) {
                var allIDs = allIDsRange.dim(0).asList();
                var newRange = [];
                allIDs.forEach(function (id, i) {
                    if (newRows.indexOf(id.toString()) > -1) {
                        newRange.push(i);
                    }
                });
                _this._activeGraphRows = range.list(newRange);
                _this.refreshActiveGraphView().then(function () {
                    events.fire(TABLE_VIS_ROWS_CHANGED_EVENT);
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TableManager.prototype, "selectedAttributes", {
        /**
         * Updates the array of selectedAttributes in the panel.
         * @param newRows
         */
        set: function (attributes) {
            this._selectedAttributes = attributes;
        },
        enumerable: true,
        configurable: true
    });
    TableManager.prototype.getColumns = function () {
        return this.table.cols();
    };
    TableManager.prototype.attachListeners = function () {
        // //Set listener for added attribute to the active list
        // events.on('attribute_added', (evt, item) => {
        //
        // });
        //
        // //Set listener for removed attribute from the active list
        // events.on('attribute_reordered', (evt, item) => {
        //   let currentRange = this.activeGraphColumns.dim(0).asList() //.concat(this.activeTableColumns.dim(0).asList());
        //
        //   // console.log(currentRange,item.newIndex,item.oldIndex);
        //   currentRange.splice(item.newIndex, 0,currentRange.splice(item.oldIndex,1)[0]);
        //   // console.log(currentRange)
        //   this.activeGraphColumns = range.list(currentRange);
        //
        //
        //   this.refreshActiveGraphView().then(()=>{events.fire(COL_ORDER_CHANGED_EVENT);});
        //
        // });
        // //Set listener for reordering attribute within the active list
        // events.on('attribute_removed', (evt, item) => {
        //
        //
        // });
    };
    return TableManager;
}());
export default TableManager;
/**
 * Method to create a new TableManager instance
 * @returns {TableManager}
 */
export function create() {
    return new TableManager();
}
//# sourceMappingURL=tableManager.js.map