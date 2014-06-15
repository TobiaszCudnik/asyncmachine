goog.provide('ic.component.TreeModel');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('ic.analytics');
goog.require('ic.analytics.ItemChanges');
goog.require('ic.analytics.TrackedItems');
goog.require('ic.component.ListComponentModel');
goog.require('ic.component.event.Origin');
goog.require('ic.component.events.RecordUpdated');
goog.require('ic.component.events.SaveFinished');
goog.require('ic.component.events.SaveInProgress');
goog.require('ic.component.utils');
goog.require('ic.data.EventType');
goog.require('ic.events.ComponentDataUpdate');
goog.require('ic.events.EntityComponentSavedEvent');
goog.require('ic.utils.Request');



/**
 * @constructor
 * @param {!Object.<string, number>} recordTypes
 * @param {!Object.<string, number>} recordsHierarchy
 * @struct
 * @extends {ic.component.ListComponentModel}
 */
ic.component.TreeModel = function(recordTypes, recordsHierarchy) {
  goog.base(this);

  /**
   * @type {!Object.<string, number>}
   */
  this.recordTypes = recordTypes;

  /**
   * @type {!Object.<string, number>}
   */
  this.recordHierarchy = recordsHierarchy;

  /**
   * @type {?string}
   */
  this.deleteUrl = null;

  /**
   * @type {?string}
   */
  this.saveUrl = null;

  /**
   * @type {!ic.processor.Data}
   */
  this.dataProcessor = new ic.processor.Data();
};
goog.inherits(ic.component.TreeModel, ic.component.ListComponentModel);


/**
 * Converts typed ID to record-only ID.
 *
 * @param {string|number} id
 * @return {number}
 */
ic.component.TreeModel.prototype.getUntypedId = function(id) {
  if (!goog.string.contains(id.toString(), '#')) {
    return Number(id);
  } else {
    return Number(id.split('#')[1]);
  }
};


/**
 * Converts typed ID into record type ID.
 *
 * @param {string|number} id
 * @return {number}
 */
ic.component.TreeModel.prototype.getTypeId = function(id) {
  if (id.toString().indexOf('#') == -1) {
    return Number(id);
  } else {
    return Number(id.split('#')[0]);
  }
};


/**
 * Convert single circuit entry to compiler-friendly format.
 *
 * @param {!Object} item Raw record item data.
 * @return {!Object} Compilation friendly version of passed record.
 * @private
 */
ic.component.TreeModel.prototype.convertRecord_ = function(item) {
  var parentType = this.getParentTypeFromRecordType(item['record_type_id']);

  // Convert common fields.
  var parsed = {
    id: this.getTypedId(item['id'], item['record_type_id']),
    parentId: item['parent_id'],
    // Real server ID.
    recordId: item['id'],
    recordTypeId: item['record_type_id']
  };

  // Reference a local ID of the parent, used by ListView.
  if (parentType != this.recordTypes.ROOT) {
    goog.asserts.assert(parsed.parentId, 'Parent\'s ID should be present.');
    parsed.parentId = this.getTypedId(parsed.parentId, parentType);
  }

  return this.convertRecordByType(parsed, item);
};


/**
 * @override
 */
ic.component.TreeModel.prototype.convertServerData =
    function(rawData) {
  var data = rawData['records'];

  return data.map(this.convertRecord_, this);
};


/**
 * Converts type-specific server data, based on item.recordTypeId and
 * this.recordTypes.
 * @param {!Object} item
 * @param {!Object} rawData
 */
ic.component.TreeModel.prototype.convertRecordByType = goog.abstractMethod;


/**
 * @param {string} id
 * @return {?Object}
 * @override
 */
ic.component.TreeModel.prototype.getRecordById;


/**
 * Combines record's ID and type and returns a 'typed ID'.
 * @param {string} id Record ID.
 * @param {number} type Type's enum value.
 * @return {string}
 */
ic.component.TreeModel.prototype.getTypedId = function(id, type) {
  return type + '#' + id;
};


/**
 * @override
 */
ic.component.TreeModel.prototype.addRecord = function(record) {
  var data = this.getData();
  data.push(record);
  this.setData(data);
};


/**
 * Save data - argument in compilation-friendly format.
 *
 * @param {!Object} record Record to save.
 * @param {!function()} success Success callback.
 * @param {!Object} successScope Success scope object.
 * @param {!function(string)} failure Failure callback.
 * @param {!Object} failureScope Failure scope object.
 */
ic.component.TreeModel.prototype.saveRecord = function(record,
    success, successScope, failure, failureScope) {
  this.saveRecords([record], success, successScope, failure,
      failureScope);
};


/**
 * Delete circuit entries with given ids.
 *
 * @param {!Array.<number>} recordIds Ids of records to be deleted.
 * @param {!function(string)} failure Failure callback.
 * @param {!Object} failureScope Scope for failure callback.
 */
ic.component.TreeModel.prototype.deleteRecords = function(recordIds,
    failure, failureScope) {
  this.dispatchEvent(new ic.component.events.SaveInProgress(
      ic.component.event.Origin.COMPONENT));

  var componentId = this.getComponentId();
  var entityId = this.getEntityId();
  var convertedIds = recordIds.map(function(id) {
    return {
      'id': this.getUntypedId(id),
      'record_type_id': this.getTypeId(id)
    };
  }, this);
  var requestData = {
    'entity_id': entityId,
    'records': convertedIds
  };

  goog.asserts.assert(this.deleteUrl, 'Delete URL is present');
  var request = new ic.utils.Request(this.deleteUrl,
      requestData);

  request.setSuccessCallback(function(data) {
    this.dispatchEvent(new ic.component.events.SaveFinished(
        ic.component.event.Origin.COMPONENT));
    this.deleteRecordsFromData(recordIds);
    this.dispatchEvent(new ic.events.EntityComponentSavedEvent(entityId));

    if (goog.isArray(data['updates']) && data['updates'].length) {
      data['updates'].forEach(function(update) {
        if (!goog.isDefAndNotNull(update['obfuscated_gaia_id'])) {
          update['obfuscated_gaia_id'] = 'me';
        }
      }, this);
      this.dispatchEvent(new ic.events.ComponentDataUpdate(
          ic.component.utils.getUpdatesComponentId(
              ic.component.utils.getEntityTypeFromComponentType(
                  this.getComponentId())), data['updates']));
    }

    ic.analytics.trackItemChange(componentId,
        // TODO(tcudnik): Method
        ic.analytics.TrackedItems.NC_COM_CIRCUIT,
        ic.analytics.ItemChanges.DELETE
    );
  }, this);

  request.setFailureCallback(function(message) {
    this.dispatchEvent(new ic.component.events.SaveFinished(
        ic.component.event.Origin.COMPONENT));
    failure.call(failureScope || this, message);
  }, this);

  request.send();
};


/**
 * @override
 */
ic.component.TreeModel.prototype.setData = function(data) {
  this.dataProcessor.reset();
  this.dataProcessor.addArray( /** @type {!Array.<!Object>} */(data));
  return goog.base(this, 'setData', data);
};


/**
 * @param {!Array.<!Object>} records Records to save.
 * @param {!function(Object)} success Success callback.
 * @param {!Object} successScope Scope for success callback.
 * @param {!function(string)} failure Failure callback.
 * @param {!Object} failureScope Scope for failure callback.
 */
ic.component.TreeModel.prototype.saveRecords = function(records,
    success, successScope, failure, failureScope) {
  this.dispatchEvent(ic.data.EventType.DIALOG_SAVE_IN_PROGRESS);

  var requestData = {
    'entity_id': this.getEntityId(),
    'records': []
  };

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    // TODO(tcudnik): Assert existing ID (only bulk edit).
    requestData['records'].push(this.unconvertRecord(record));
  }

  goog.asserts.assert(this.saveUrl, 'Save URL is present');
  var request = new ic.utils.Request(this.saveUrl, requestData);

  request.setSuccessCallback(function(data) {
    this.dispatchEvent(ic.data.EventType.DIALOG_SAVE_FINISHED);

    var componentId = this.getComponentId();

    for (var i = 0; i < records.length; i++) {
      var record = records[i];

      if (!record.id) {
        record.recordId = data['records'][i];
        record.id = this.getTypedId(data['records'][i], record.recordTypeId);
        this.addRecord(record);
        ic.analytics.trackItemChange(componentId,
            // TODO(tcudnik): Method
            ic.analytics.TrackedItems.NC_COM_CIRCUIT,
            ic.analytics.ItemChanges.ADD
        );
      } else {
        this.updateRecord(record);
        ic.analytics.trackItemChange(componentId,
            // TODO(tcudnik): Method
            ic.analytics.TrackedItems.NC_COM_CIRCUIT,
            ic.analytics.ItemChanges.EDIT
        );
      }
    }

    // Emit an event same as the one in #setData
    this.dispatchEvent(ic.data.EventType.UPDATE);

    var ids = records.map(function(item) {
      return item.id;
    });
    var recordUpdatedEvent = new ic.component.events.RecordUpdated(
        this.getEntityId(), componentId, ids);
    this.dispatchEvent(recordUpdatedEvent);

    // TODO (lkufel): check if this event is needed
    this.dispatchEvent(new ic.events.EntityComponentSavedEvent(
        this.getEntityId()));

    // TODO(rvasicek): remove after b/11182377 is resolved
    if (!data['updates'] && data['last_update']) {
      data['updates'] = [data['last_update']];
    }
    if (goog.isArray(data['updates']) && data['updates'].length) {
      data['updates'].forEach(function(update) {
        if (!goog.isDefAndNotNull(update['obfuscated_gaia_id'])) {
          update['obfuscated_gaia_id'] = 'me';
        }
      }, this);
      this.dispatchEvent(new ic.events.ComponentDataUpdate(
          ic.component.utils.getUpdatesComponentId(
              ic.component.utils.getEntityTypeFromComponentType(
                  this.getComponentId())), data['updates']));
    }

    if (success) {
      success.call(successScope || this, data);
    }
  }, this);

  request.setFailureCallback(function(message) {
    this.dispatchEvent(ic.data.EventType.DIALOG_SAVE_FINISHED);

    if (failure) {
      failure.call(failureScope || this, message);
    }
  }, this);

  request.send();
};


/**
 * TODO(tcudnik): template for enums?
 * @param {number} type
 * @return {number}
 */
ic.component.TreeModel.prototype.getParentTypeFromRecordType =
    function(type) {
  var ret = this.recordHierarchy[type.toString()];
  goog.asserts.assert(ret, 'Parent type present');
  return ret;
};


/**
 * @param {number} type
 * @return {!Array.<!Object>}
 */
ic.component.TreeModel.prototype.getRecordsByType = function(type) {
  return this.getData().filter(function(item) {
    return item.recordTypeId == type;
  });
};


/**
 * @param {!Object} record
 * @return {!Object}
 */
ic.component.TreeModel.prototype.unconvertRecord = function(record) {
  var types = this.recordTypes;

  var requestData = {
    'record_type_id': record.recordTypeId
  };

  if (record.id) {
    requestData['id'] = this.getUntypedId(record.id);
  } else {
    requestData['id'] = 0;
  }

  if (goog.isDefAndNotNull(record.parentId)) {
    requestData['parent_id'] = this.getUntypedId(record.parentId);
  }

  if (goog.isDefAndNotNull(record.recordTypeId)) {
    switch (record.recordTypeId) {
      case types.RFP:
        break;
      case types.VENDOR:
        requestData['name'] = record.name;
        requestData['vendor_id'] = record.vendorId;
        break;
      case types.QUOTE:
        break;
    }
  }

  return requestData;
};
