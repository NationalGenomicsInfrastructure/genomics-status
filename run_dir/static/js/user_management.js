/*
-File: user_management.js
-URL: /static/js/user_management.js
-Powers /user_management/ - template is run_dir/design/user_management.html
-*/

const vUserManagement = {
    data() {
        return {
            user: {},
            users: [],
            roles: {},
            userLoaded: false,
            dataTable: null,
            modifyUserModal: null,
            deleteUserModal: null,
            userModalData: {
                username: '',
                name: '',
                initials: '',
                roles: []
            },
            newUserForm: {
                username: '',
                name: '',
                roles: []
            },
            isCreating: false,
            isModifying: false,
            isDeleting: false
        };
    },
    computed: {
        isAdmin() {
            if (!this.userLoaded || !this.user) {
                return false;
            }
            return this.user && this.user.isAdmin;
        },
        tableKey() {
            return Object.keys(this.users).length + JSON.stringify(this.users);
        }
    },
    methods: {
        getCurrentUser() {
            axios.get('/api/v1/current_user')
            .then(response => {
                this.user = response.data;
                if (this.user.roles && this.user.roles.includes('admin')) {
                    this.user.isAdmin = true;
                }
                this.userLoaded = true;
            })
            .catch(error => console.error('Error fetching current user:', error));
        },
        getUserRoles() {
            axios.get('/api/v1/user_management/roles_teams')
                .then(response => {
                    this.roles = response.data['roles'];
                })
                .catch(error => console.error('Error fetching user roles:', error));
        },
        fetchUsers() {
            axios.get('/api/v1/user_management/users')
                .then(response => {
                    this.users = response.data;
                    if (!this.modifyUserModal && this.$refs.modifyUserModal)
                        this.modifyUserModal = new bootstrap.Modal(this.$refs.modifyUserModal);
                    if (!this.deleteUserModal && this.$refs.delUserConfirmModal)
                        this.deleteUserModal = new bootstrap.Modal(this.$refs.delUserConfirmModal);
                })
                .catch(error => console.error('Error fetching users:', error))
                .finally(() => {
                    this.init_datatable();
                }
            );
        },

        init_datatable() {
            /* Just the ordinary datatable initializing. */
            if ($.fn.dataTable.isDataTable( '#user_table')){
                this.reset_datatable();
            }
            this.dataTable = $('#user_table').DataTable({
                "paging":false,
                "info":false,
                "order": [[ 0, "asc" ]]
            });
            this.dataTable.columns().every(function() {
                var that = this;
                $('input', this.footer()).on( 'keyup change', function() {
                    that
                        .search(this.value)
                        .draw();
                });
            });

            $('#user_table_filter').addClass('col-md-2');
            $("#user_table_filter").appendTo("#searchGoesHere");
            $('#user_table_filter label input').appendTo($('#user_table_filter'));
            $('#user_table_filter label').remove();
            $('#user_table_filter input').addClass('form-control p-2 mb-2 float-right');
            $("#user_table_filter input").attr("placeholder", "Search table...");
        },
        reset_datatable() {
            /* A bit hacky way to get datatables to handle a DOM update:
             *  - drop it and recreate it.
             */
            this.dataTable.destroy();
            $('#user_table_filter').remove();
            this.dataTable = null;
        },
        openModifyModal(username, info) {
            this.userModalData.username = username;
            this.userModalData.name = info.name || '';
            this.userModalData.initials = info.initials || '';
            this.userModalData.roles = info.roles;

            // Show the modal using ref
            this.modifyUserModal.show();
        },
        openDeleteModal(username) {
            this.userModalData.username = username;

            // Show the modal using ref
            this.deleteUserModal.show();
        },
        modifyUser(option){
            let username = ""
            let roles = {};
            let name = "";
            let initials = "";
            if(option === "create") {
                this.isCreating = true;
                username = this.newUserForm.username;
                roles = this.newUserForm.roles;
                name = this.newUserForm.name;
            }
            if(option ==="modify"){
                this.isModifying = true;
                username = this.userModalData.username;
                roles =  this.userModalData.roles;
                name = this.userModalData.name;
                initials= this.userModalData.initials;
            }
            if(option ==="delete"){
                this.isDeleting = true;
                username = this.userModalData.username;
            }
            axios
            .post('/api/v1/user_management/users?action=' + option, {
                'username' : username,
                'roles' : roles,
                'name' : name,
                'initials' : initials
            })
            .then(response => {
                this.reset_datatable();
                this.fetchUsers();
            })
            .catch(error => {
                alert('Unable to submit running note, please try again or contact a system administrator.')
            })
            .finally(() => {
                this.isCreating = false;
                this.isModifying = false;
                this.isDeleting = false;
                // Hide the modal after operation
                if (option === 'create') {
                    $('#createUserModal').modal('hide');
                    this.newUserForm = { username: '', name: '', roles: [] };
                } else if (option === 'modify') {
                    this.modifyUserModal.hide();
                } else if (option === 'delete') {
                    this.deleteUserModal.hide();
                }
            });
        }
    },
    mounted() {
        this.getCurrentUser();
        this.getUserRoles();
        this.fetchUsers();
    },
    template:
     /*html*/`
    <div class="container-xxl">
        <div class="row">
            <div class="col-10 offset-1">
            <h1 class="page_title my-4">
                <span id="page_title">User Management</span> <small class="text-muted">Create and modify users of Genomics Status</small>
            </h1>
            </div>
        </div>
        <div v-if="!userLoaded" class="row">
            <div class="col-10 offset-1">
                <p>Loading user information...</p>
            </div>
        </div>
        <div v-else-if="!isAdmin" class="row">
            <div class="col-10 offset-1">
                <p>Sorry! Your user role does not allow you to view this page!</p>
            </div>
        </div>
        <div v-else>
            <div class="row">
                <div class="col-10 offset-1">
                <div id="searchGoesHere" class="row">
                    <div class="col mr-auto">
                        <button class="btn btn-success btn-lg mb-3 col mr-auto" data-toggle="modal" type="button" data-target="#createUserModal">
                        <i class="fa fa-plus my-2"></i> Create New User
                        </button>
                    </div>
                </div>
                </div>
            </div>
            <div class="row">
                <div class="col-10 offset-1">
                <table :key="tableKey" class="table table-striped table-bordered sortable" id="user_table">
                    <thead>
                    <tr class="sticky darkth">
                        <th class="sort" data-sort="user_name">User Name</th>
                        <th class="sort" data-sort="name">Name</th>
                        <th class="sort" data-sort="initials">Initials</th>
                        <th class="sort" data-sort="permissions">Permissions</th>
                    </tr>
                    </thead>
                    <tfoot>
                    <tr class="darkth">
                        <th class="sort" data-sort="user_name"><input class="form-control search search-query" type="text" placeholder="User Name" /></th>
                        <th class="sort" data-sort="name"><input class="form-control search search-query" type="text" placeholder="Name" /></th>
                        <th class="sort" data-sort="initials"><input class="form-control search search-query" type="text" placeholder="Initials" /></th>
                        <th class="sort" data-sort="permissions"><input class="form-control search search-query" type="text" placeholder="Permissions" /></th>
                    </tr>
                    </tfoot>
                    <tbody class="list" id="user_table_body">
                        <tr v-for="(info, name) in this.users" :key="name">
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm ml-2 btn-outline-primary btn-large" @click="openModifyModal(name, info)">
                                        <i class="fa fa-wrench mr-1"></i>Modify
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger btn-large delete-user-btn"
                                            :disabled="name === this.user.email"
                                            @click="openDeleteModal(name)">
                                        <i class="fa fa-times mr-1"></i>Delete
                                    </button>
                                </div>
                                <span class="ml-3"> {{ name }} </span>
                            </td>
                            <td>{{ info['name'] }}</td>
                            <td>{{ info['initials'] }}</td>
                            <td>
                            {{ info['roles'] ? info['roles'].map(role => this.roles[role]).join(', ') : '' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>

            <div id="createUserModal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-light">
                            <h4 class="modal-title"><i class="fa fa-plus mr-2"></i>Add User</h4>
                            <button type="button" class="btn-close" data-dismiss="modal"><span class="sr-only">Cancel</span></button>
                        </div>
                        <div class="modal-body">
                            <form id="createUserForm" class="form" role="form">
                                <p class="fw-bold">Create new user for Genomics-Status with the specified permissions.</p>
                                <div class="row">
                                    <div class="col-6">
                                        <div>
                                        <label for="createUserName" class="fw-bold">Name</label>
                                        <p class="text-muted mb-1">Enter user email (only scilifelab addresses).</p>
                                        <input class="form-control"
                                               id="createUserName"
                                               placeholder="Name..."
                                               type="text"
                                               v-model="newUserForm.username">
                                        </div>
                                    </div>
                                    <div class="col-5 ml-5">
                                        <label class="control-label fw-bold">Permissions</label>
                                        <p class="text-muted mb-1"> Optionally add permissions</p>
                                        <div v-for="(role_value, role_key) in this.roles" :key="role_key" class="form-check-lg create-user-role-checkbox">
                                            <input class="form-check-input mr-2"
                                                   type="checkbox"
                                                   :value="role_key"
                                                   :id="'create_check_' + role_key"
                                                   v-model="newUserForm.roles">
                                            <label class="form-check-label" :for="'create_check_' + role_key">
                                             {{ role_value }}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                        <button class="btn btn-secondary" data-dismiss="modal" aria-hidden="true">Cancel</button>
                        <button class="btn btn-primary"
                                type="button"
                                id="submitCreateUserBtn"
                                @click="modifyUser('create')">
                                <span v-if="isCreating">
                                    <i class="fa fa-spinner fa-spin mr-1"></i> Saving...
                                </span>
                                <span v-else>Save</span>
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <div ref="modifyUserModal" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-light">
                            <h4><i class="fa fa-wrench mr-2"></i>User</h4>
                            <button type="button" class="btn-close" data-dismiss="modal"><span class="sr-only">Cancel</span></button>
                        </div>
                        <div class="modal-body">
                        <form id="modifyUserForm" class="form" role="form">
                            <div class="row">
                                <p class="fw-bold">Modify existing user in Genomics-Status.</p>
                                <p>The user must re-login to Genomics-Status after their profile has been modified for the changes to be reflected.</p>
                            </div>
                            <div class="row my-2">
                            <div class="col mr-4">
                                <label for="pickUser" class="fw-bold">User Name</label>
                                <div>
                                    <input v-model="userModalData.username" class="form-control" placeholder="" disabled type="text">
                                </div>
                                <label for="modifyName" class="fw-bold">Name</label>
                                <input v-model="userModalData.name" class="form-control" placeholder="Name..." type="text">
                                <label for="modifyInitials" class="fw-bold">Initials</label>
                                <input v-model="userModalData.initials" class="form-control" placeholder="Initials..." type="text">
                            </div>
                            <div class="col">
                                <label class="fw-bold">Permissions</label>
                                <div v-for="(role_value, role_key) in this.roles" :key="role_key" class="form-check-lg modify-user-role-checkbox">
                                    <input v-model="userModalData.roles"
                                        class="form-check-input mr-2"
                                        type="checkbox"
                                        :value="role_key"
                                        :id="'create_check_' + role_key">
                                    <label class="form-check-label"  :for="'create_check_' + role_key">
                                    {{ role_value }}
                                    </label>
                                </div>
                            </div>
                            </div>
                        </form>
                        </div>
                        <div class="modal-footer">
                        <button class="btn btn-secondary" data-dismiss="modal" aria-hidden="true">Cancel</button>
                        <button class="btn btn-primary"
                                data-action="saveUserSettings"
                                type="button"
                                @click="modifyUser('modify')">
                                <span v-if="isModifying">
                                    <i class="fa fa-spinner fa-spin mr-1"></i> Saving...
                                </span>
                                <span v-else>Save</span>
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <div ref="delUserConfirmModal" class="modal fade">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header bg-light">
                            <h4>Delete User Confirmation</h4>
                            <button type="button" class="btn-close" data-dismiss="modal"><span class="sr-only">Cancel</span></button>
                        </div>
                        <div class="modal-body">
                            <form id="DeleteUser" class="form form-search" role="form">
                                <div class=" form-horizontal">
                                <p>Are you sure you want to delete this user?</p>
                                <div id="deleteUserName">
                                    <input class="form-control"  v-model="userModalData.username" placeholder="" disabled type="text">
                                </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-dismiss="modal" aria-hidden="true">Cancel</button>
                            <button class="btn btn-primary"
                                    id="delUserConfirmBtnModal"
                                    type="button"
                                    @click="modifyUser('delete')">
                                    <span v-if="isDeleting">
                                        <i class="fa fa-spinner fa-spin mr-1"></i> Deleting...
                                    </span>
                                    <span v-else>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
}

const app = Vue.createApp(vUserManagement);
app.mount('#user_management_main');