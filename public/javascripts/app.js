// validate form input
// pass functions as arguments
// add more control inside the contact object for filtering (flagged/not flagged)
// clean up HTML

import debounce from '/javascripts/debounce.js';

$(function() {
  const API = {
    refreshContacts: function() {
      $.ajax({
        url: '/api/contacts',
        type: 'GET',
        dataType: 'json',
      }).done(function(json) {
        ContactManager.refreshContactsFromServer(json);
        App.showHomepage();
      });
    },

    updateContact: function(contactId, contactData) {
      $.ajax({
        url: '/api/contacts/' + contactId,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(contactData),
      }).done(function() {
        API.refreshContacts();
      });
    },

    saveContact: function(contactData) {
      $.ajax({
        url: '/api/contacts/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(contactData),
      }).done(function() {
        API.refreshContacts();
      });
    },

    deleteContact: function(contactId) {
      $.ajax({
        url: '/api/contacts/' + contactId,
        type: 'DELETE',
      }).done(function() {
        API.refreshContacts();
      });
    },
  };

  const Tag = {
    increment: function() {
      this.count++;
    },

    toggle: function() {
      this.selected = !this.selected;
      this.class = this.selected ? 'highlighted' : '';
    },

    deselect: function() {
      this.selected = false;
      this.class = '';
    },

    init: function(name) {
      this.name = name;
      this.count = 0;
      this.class = '';
      this.selected = false;

      return this;
    },
  };

  const TagManager = {
    tags: [],

    getSelectedTags: function() {
      return this.tags.filter(tag => tag.selected);
    },

    getAllTagNames: function() {
      return this.getTagNames(this.tags);
    },

    getTagNames: function(tags) {
      return tags ? tags.map(tag => tag.name) : [];
    },

    sortTags: function() {
      this.tags = this.tags.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else {
          return 1;
        }
      });
    },

    exist: function(tagName) {
      return this.getAllTagNames().indexOf(tagName) !== -1;
    },

    createTag: function(tagName) {
      this.tags.push(Object.create(Tag).init(tagName));
      this.sortTags();
    },

    getTag: function(tagName) {
      if (!this.exist(tagName)) {
        this.createTag(tagName);
      }

      return this.tags.filter(tag => tag.name === tagName)[0];
    },

    parseTags: function(tagNames) {
      tagNames = tagNames ? tagNames.split(',') : [];

      return tagNames.map(tagName => {
        let tag = this.getTag(tagName);
        tag.increment();

        return tag;
      });
    },

    reset: function() {
      this.tags.forEach(tag => {
        tag.deselect();
      });
    },
  };

  const Contact = {
    init: function(details) {
      this.id = details.id;
      this.full_name = details.full_name;
      this.phone_number = details.phone_number;
      this.email = details.email;
      this.tags = TagManager.parseTags(details.tags);

      return this;
    },
  };

  const ContactManager = {
    contacts: [],

    getContactById: function(id) {
      return this.contacts.filter(contact => +contact.id === +id)[0];
    },

    createContacts: function(data) {
      return data.map(details => Object.create(Contact).init(details));
    },

    refreshContactsFromServer: function(data) {
      TagManager.tags = [];
      this.contacts = this.createContacts(data);
    },

    init: function() {
      API.refreshContacts();
    },
  };

  const App = {
    $main: $('main'),
    $form: $('#form'),
    $container: $('#container'),
    $tagList: $('#tag-filter ul'),
    $searchBar: $('#search-bar'),
    $viewAllContacts: $('#view-all-contacts'),
    $addContact: $('#add-contact'),
    $action: $('#action'),
    $formCancel: $('#form-cancel'),
    $formSubmit: $('#form-submit'),
    $formName: $('#form-name'),
    $formEmail: $('#form-email'),
    $formPhone: $('#form-phone'),
    $formTags: $('#form-tags'),
    $noMatches: $('#no-matches'),
    $filterTerm: $('#filter-term'),
    $filterTags: $('#filter-tags'),


    sortContacts: function(contacts) {
      let sortedContacts = contacts.sort((a, b) => {
        if (a.full_name.toLowerCase() < b.full_name.toLowerCase()) {
          return -1;
        } else {
          return 1;
        }
      });

      return sortedContacts;
    },

    showContacts: function(contacts) {
      this.$noMatches.hide();
      contacts = { contacts: this.sortContacts(contacts) };
      this.$container.html(this.contactTemplate(contacts));
    },

    showAllContacts: function() {
      this.showContacts(ContactManager.contacts);
    },

    showTags: function() {
      let tagList = {tags: TagManager.tags};
      this.$tagList.html(this.tagListTemplate(tagList));
    },

    showHomepage: function() {
      this.reset();
      this.showAllContacts();
      this.showTags();
      this.$main.slideDown();
      this.$container.slideDown();
      this.$form.slideUp();
    },

    showForm: function(action, contactId) {
      if (!!contactId) {
        let contact = ContactManager.getContactById(contactId);
        this.$form.attr('data-id', contactId);
        this.$formName.val(contact.full_name);
        this.$formEmail.val(contact.email);
        this.$formPhone.val(contact.phone_number);
        this.$formTags.val(TagManager.getTagNames(contact.tags).join(', '));
      }

      this.$action.html(action);
      this.$container.slideUp();
      this.$form.slideDown();
    },

    filterTags: function(e) {
      e.preventDefault();

      let tagName = $(e.target).html();
      let tag = TagManager.getTag(tagName);
      tag.toggle();

      this.filterContacts();
    },

    filterContactsByTags: function(contacts, tags) {
      if (!tags) return contacts;

      let filteredContacts = contacts.filter(contact => {
        for (let i = 0; i < tags.length; i++) {
          if (contact.tags.indexOf(tags[i]) === -1) {
            return false;
          }
        }

        return true;
      });

      return filteredContacts;
    },

    filterContactsByName: function(contacts, term) {
      if (!term) return contacts;

      let filteredContacts = contacts.filter(contact => {
        return contact.full_name.toLowerCase().match(term);
      });

      return filteredContacts;
    },

    filterContacts: function() {
      let contacts = ContactManager.contacts;
      let selectedTags = TagManager.getSelectedTags();
      let searchTerm = this.$searchBar.val().toLowerCase();

      contacts = this.filterContactsByTags(contacts, selectedTags);
      contacts = this.filterContactsByName(contacts, searchTerm);

      if (contacts.length === 0) {
        this.$noMatches.show();
        this.$container.hide();
        this.$filterTerm.html(this.$searchBar.val());

        let selectedTags = TagManager.getSelectedTags();
        let tagNames = TagManager.getTagNames(selectedTags);
        this.$filterTags.html(tagNames.join(', '));
      } else {
        this.showContacts(contacts);
      }

      this.showTags();
    },

    reset: function() {
      TagManager.reset();
      this.$form.attr('data-id', '');
      this.$formName.val('');
      this.$formEmail.val('');
      this.$formPhone.val('');
      this.$formTags.val('');
      this.$searchBar.val('');
    },

    getContactId: function(e) {
      return $(e.target).closest('article').attr('data-id');
    },

    deleteContact: function(contactId) {
      let name = ContactManager.getContactById(contactId).full_name;
      let answer = confirm(`Do you want to delete ${name}'s record?`);

      if (answer) {
        API.deleteContact(contactId);
      }
    },

    cleanTags: function(tagNames) {
      tagNames = tagNames.toLowerCase()
                         .split(',')
                         .map(tag => tag.trim().split(' ').join('_'))
                         .sort()
                         .filter(function(tag, idx, arr) {
                            if (tag === '') return false;
                            return idx === arr.indexOf(tag);
                          });

      return tagNames.join(',');
    },

    submitForm: function(e) {
      e.preventDefault();

      let contactId = this.$form.attr('data-id');

      if (contactId) {
        API.updateContact(contactId, {
          id: contactId,
          full_name: this.$formName.val(),
          email: this.$formEmail.val(),
          phone_number: this.$formPhone.val(),
          tags: this.cleanTags(this.$formTags.val()),
        });
      } else {
        API.saveContact({
          full_name: this.$formName.val(),
          email: this.$formEmail.val(),
          phone_number: this.$formPhone.val(),
          tags: this.cleanTags(this.$formTags.val()),
        });
      }

      API.refreshContacts();
    },

    registerTemplates: function() {
      this.contactTemplate = Handlebars.compile($('#contacts-template').html());
      this.tagListTemplate = Handlebars.compile($('#tag-list-template').html());
      Handlebars.registerPartial('tag', $('#tag-template').html());
    },

    bindEventListeners: function() {
      this.$main.on('click', '.tag', e => this.filterTags(e));
      this.$searchBar.on('keyup', e => this.filterContacts(e));
      this.$viewAllContacts.on('click', () => this.showHomepage());
      this.$addContact.on('click', () => this.showForm('Create'));
      this.$formCancel.on('click', () => this.showHomepage());
      this.$formSubmit.on('click', e => this.submitForm(e));
      this.$container.on('click', '.edit', e => {
        this.showForm('Edit', this.getContactId(e))
      });
      this.$container.on('click', '.delete', e => {
        this.deleteContact(this.getContactId(e))
      });
    },

    init: function() {
      this.filterContacts = debounce(this.filterContacts.bind(this), 300);

      ContactManager.init();
      this.registerTemplates();
      this.bindEventListeners();
    },
  };

  App.init();
});