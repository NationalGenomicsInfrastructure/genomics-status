import json

from ibm_cloud_sdk_core.api_exception import ApiException

from status.util import SafeHandler


class UserManagementHandler(SafeHandler):
    """Serves a page with users and roles listed, with the option to create new users
    URL: /user_management
    """

    def get(self):
        t = self.application.loader.load("user_management.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                roles=self.application.genstat_defaults["roles"],
            )
        )


class UserManagementDataHandler(SafeHandler):
    """Serves the data for populating user roles table and also methods to modify user roles
    URL: /api/v1/user_management/users
    """

    def get(self):
        self.set_header("Content-type", "application/json")
        view_result = {}
        add_roles = False
        if self.get_current_user().is_admin:
            add_roles = True

        for row in self.application.cloudant.post_view(
            db="gs_users", ddoc="authorized", view="info"
        ).get_result()["rows"]:
            view_result[row["key"]] = {
                "initials": row["value"].get("initials", ""),
                "name": row["value"].get("name", ""),
            }

            if add_roles:
                view_result[row["key"]]["roles"] = row["value"].get("roles", [])

        self.write(view_result)

    def post(self):
        data = json.loads(self.request.body)
        userToChange = data["username"]

        view_result = self.application.cloudant.post_view(
            db="gs_users",
            ddoc="authorized",
            view="users",
            key=userToChange,
            include_docs=True,
        ).get_result()["rows"]
        user_doc = view_result[0]["doc"] if view_result else {}
        action = self.get_argument("action")
        if self.get_current_user().is_admin:
            if action == "create":
                if user_doc:
                    self.set_status(409)
                    self.write("User already exists!")
                else:
                    response = self.application.cloudant.post_document(
                        db="gs_users", document=data
                    ).get_result()
                    if not response.get("ok", False):
                        self.set_status(400)
                        self.finish("User creation failed!")

                    self.set_status(201)
                    self.write({"success": "success!!"})
            else:
                if action == "modify" and user_doc:
                    user_doc["roles"] = data["roles"]
                    user_doc["name"] = data["name"]
                    user_doc["initials"] = data["initials"]
                    response = self.application.cloudant.put_document(
                        db="gs_users",
                        document=user_doc,
                        doc_id=user_doc["_id"],
                    )
                    if not response.get("ok", False):
                        self.set_status(400)
                        self.finish("User modification failed!")

                    self.set_status(201)
                    self.write({"success": "success!!"})

                elif action == "delete" and user_doc:
                    try:
                        response = self.application.cloudant.delete_document(
                            db="gs_users", doc_id=user_doc["_id"], rev=user_doc["_rev"]
                        )
                    except ApiException as e:
                        self.set_status(400)
                        self.finish(e.message)

                    self.set_status(201)
                    self.write({"success": "success!!"})
                else:
                    self.set_status(400)
                    self.write("User not selected!")
        else:
            self.set_status(401)
            self.finish(
                "<html><body>Your user does not have permission to perform this operation!</body></html>"
            )


class CurrentUserDataHandler(SafeHandler):
    """Serves data for the current user
    URL: /api/v1/user_management/users
    """

    def get(self):
        self.set_header("Content-type", "application/json")
        user = self.get_current_user()
        if user:
            self.write(
                {
                    "user": user.name,
                    "email": user.email,
                    "roles": user.roles,
                }
            )
        else:
            self.set_status(401)
            self.write({"error": "Unauthorized"})
