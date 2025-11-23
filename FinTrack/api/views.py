from django.shortcuts import render
import openai
import datetime, re, hashlib
import os, requests, json
from rest_framework.response import Response
from rest_framework.views import APIView
from unidecode import unidecode
from .assistant_tools import get_news_today, get_userData_analysis

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from rest_framework.decorators import api_view, permission_classes #funciton based view used this with all views
from rest_framework.permissions import IsAuthenticated 
# from base.models import Categories ,Transactions  # <-- import table from base(database information)
from django.contrib.auth.models import User  # <-- default table in the database
from django.contrib.auth.hashers import make_password , check_password
from django.http import JsonResponse
from .serializers import UserSerializer
from django.shortcuts import get_object_or_404 , redirect
# from datetime import timedelta, datetime
from datetime import datetime, timedelta, timezone
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from django.db import connection
from .sendimagetoAPI import extract_text_from_image
from .claude_analyzer_agent import FinancialAnalyticsAPI
import pandas as pd
from tika import parser
# from pprint import pprint

import os
from sendgrid import SendGridAPIClient    
from sendgrid.helpers.mail import Mail
import jwt





# Load API Key
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI()

assistant = os.getenv("AI_ASSISTANT_KEY")
claude = os.getenv("anthropic_api")

from dotenv import load_dotenv
import os

# Load variables from .env file into the environment
load_dotenv()


def markdown_to_text(md):
    # Remove headings
    md = re.sub(r'^#{1,6}\s*', '', md, flags=re.MULTILINE)
    # Remove bold/italic
    md = re.sub(r'\*\*|\*|__|_', '', md)
    # Remove lists
    md = re.sub(r'^\s*[-+*]\s+', '', md, flags=re.MULTILINE)
    return md.strip()
class chatAssistantView(APIView):
    def post(self, request):
        authenticate_user(request)
        user_message = request.data.get("message", "")
        accountID = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        thread = request.COOKIES.get("thread_id", None)
        file = request.FILES.get("file")
        if file: 
            # print("File received")
            # print(file.name)
            file_path = os.path.join("uploads", file.name)  # or any subfolder in MEDIA_ROOT
            saved_path = default_storage.save(file_path, ContentFile(file.read()))
            # print("File saved at:", saved_path)
            image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif']
            print(saved_path.split('.')[-1])
            if saved_path.split('.')[-1].strip() in image_extensions:
                extractedResponse = "This is the extracted and processed file:\n"+extract_text_from_image(claude, saved_path, "claude-3-7-sonnet-20250219")
            else:
                parsed = parser.from_file(saved_path)
                extractedResponse = "This is the extracted and processed file:\n"+parsed['content']
            default_storage.delete(saved_path)
            # print(textImage)
            
        
        if thread is None:
            thread = client.beta.threads.create().id
        thread = client.beta.threads.retrieve(thread_id=thread)

        message = client.beta.threads.messages.create(thread_id=thread.id, role="user", content= (extractedResponse+"::++\n\n"+user_message) if file else user_message)
        run = client.beta.threads.runs.create_and_poll(thread_id=thread.id, assistant_id=assistant)
        messages = client.beta.threads.messages.list(thread_id = thread.id)
        # print(response3.content)
        print(messages.data[0].content[0].text.value)


        totalOfSale = [] #this is for adding transaction



        if run.status == "completed":
            response = Response({"response": markdown_to_text(unidecode(messages.data[0].content[0].text.value))}, status=200)
            response.set_cookie(
                key="thread_id",
                value=thread.id,
                httponly=True,
                secure=True,
                samesite="Strict",
                path="/",
                # expires=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
                max_age=timedelta(days=7)
            )
            # print(response["response"])
            return response
            #return jsonify({"message": response3.json()})
        elif run.status == "requires_action":
            print("Requires action")
            tool_outputs = []
            for tool in run.required_action.submit_tool_outputs.tool_calls:
                if tool.function.name == "get_news_today":
                    tool_response = get_news_today()
                    tool_outputs.append(
                        {
                        "tool_call_id": tool.id,
                        "output": tool_response
                        }
                    )
                    # try:
                    #     run = client.beta.threads.runs.submit_tool_outputs_and_poll(
                    #         thread_id=thread.id,
                    #         run_id=run.id,
                    #         tool_outputs=tool_outputs
                    #     )
                    # except Exception as e:
                    #     print(e)
                    #     print("Error - in exception")
                    #     return Response({"error": "Error"}, status=500)
                if tool.function.name == "get_userData_analysis":
                    print("get_userData_analysis")
                    with connection.cursor() as cursor:
                        cursor.callproc("getAllCategories", [])
                        # headers = [col[0] for col in cursor.description]
                        results = cursor.fetchall()
                        categories = {row[0]: row[1] for row in results}
                        print(categories)
                        while cursor.nextset():
                            pass
                        cursor.callproc("getAllTransaction", [accountID])
                        headers = [col[0] for col in cursor.description]
                        results = cursor.fetchall()
                        results = [{headers[0]: row[0], headers[1]: row[1].strftime("%Y-%m-%d"), headers[2]: row[2], headers[3]: str(row[3]), headers[4]: categories[row[4]]} for row in results]
                        while cursor.nextset():
                            pass
                        cursor.callproc("getAllBudget", [accountID])
                        headers = [col[0] for col in cursor.description]
                        budgets = cursor.fetchall()
                        budgets = [{headers[1]: row[1], headers[3]: row[3]} for row in budgets]
                        while cursor.nextset():
                            pass
                    
                        print(results)
                        print(budgets)

                    tool_response = get_userData_analysis(sample_purchases=results, budgets=budgets)
                    tool_outputs.append(
                        {
                        "tool_call_id": tool.id,
                        "output": tool_response
                        }
                    )
                    # try:
                    #     run = client.beta.threads.runs.submit_tool_outputs_and_poll(
                    #         thread_id=thread.id,
                    #         run_id=run.id,
                    #         tool_outputs=tool_outputs
                    #     )
                    # except Exception as e:
                    #     print(e)
                    #     print("Error - in exception")
                    #     return Response({"error": "Error"}, status=500)
                if tool.function.name == "add_transaction":
                    print("add_transaction")
                    function_args = json.loads(tool.function.arguments)
                    if("total" in function_args["transaction_name"].lower() or "tend" in function_args["transaction_name"].lower()):
                        tool_response = "This is not a valid transaction name" + str(function_args)
                        tool_outputs.append(
                            {
                            "tool_call_id": tool.id,
                            "output": tool_response
                            }
                        )
                        continue
                    # totalOfSale = []
                    # print(type(function_args))
                    print("function_args", function_args)
                    inTotalOfSale = False
                    for transaction in totalOfSale:
                        if ((transaction["vendor_name"] == function_args["vendor_name"] and transaction["transaction_date"] == function_args["transaction_date"] and transaction["category_id"] == function_args["category_id"]) 
                        or (function_args["category_id"] == "Tax" and transaction["vendor_name"] == function_args["vendor_name"] and transaction["transaction_date"] == function_args["transaction_date"])):
                            inTotalOfSale = True
                            transaction["amount"] += float(function_args["amount"])
                            break
                    if inTotalOfSale == False:
                        totalOfSale.append({"vendor_name": function_args["vendor_name"], "transaction_date": function_args["transaction_date"], "amount": float(function_args["amount"]), "category_id": function_args["category_id"]})
                    # if (function_args["vendor_name"] in totalOfSale and totalOfSale[function_args["vendor_name"]]["transaction_date"] == function_args["transaction_date"]
                    # and function_args["category_id"] == function_args["category_id"]):
                    #     totalOfSale[function_args["vendor_name"]]["amount"] += float(function_args["amount"])
                    # else:
                    #     totalOfSale[function_args["vendor_name"]] = {"amount": float(function_args["amount"]), "category_id": function_args["category_id"], "transaction_date": function_args["transaction_date"]}
                    tool_response = "Transaction added successfully: " + str(function_args)
                    tool_outputs.append(
                        {
                        "tool_call_id": tool.id,
                        "output": tool_response
                        }
                    )
            try:
                run = client.beta.threads.runs.submit_tool_outputs_and_poll(
                    thread_id=thread.id,
                    run_id=run.id,
                    tool_outputs=tool_outputs
                )

                if totalOfSale:
                    with connection.cursor() as cursor:
                        for transaction in totalOfSale:
                            # cursor.callproc("createTransaction", [function_args["transaction_date"], function_args["transaction_name"], float(function_args["amount"]), function_args["category_id"], accountID])
                            cursor.callproc("createTransaction", [transaction["transaction_date"], transaction["vendor_name"], float(transaction["amount"]), transaction["category_id"], accountID])
                            cursor.fetchall()
                            while cursor.nextset():
                                pass
            except Exception as e:
                print(e)
                print("Error - in exception")
                return Response({"error": "Error"}, status=500)
                    
            # while(run.status == "queued" or run.status == "in_progress" or run.status == "requires_action"):
            #     pass
            if run.status == "completed":
                messages = client.beta.threads.messages.list(thread_id = thread.id)
                print(messages.data[0].content[0].text.value)
                response = Response({"response": markdown_to_text(unidecode(messages.data[0].content[0].text.value))}, status=200)
                response.set_cookie(
                    key="thread_id",
                    value=thread.id,
                    httponly=True,
                    secure=True,
                    samesite="Strict",
                    path="/",
                    # expires=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
                    max_age=timedelta(days=7)
                )
                # print(response["response"])
                return response
            else:
                print(run.status)
                print("Failed")
                return Response({"error": "Error"}, status=500)
        else:
            print(run.status)
            return Response({"error": "Error"}, status=500)
        

class QuickAnalysisView(APIView):
    def post(self, request):
        authenticate_user(request)
        accountID = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        if file: 
            file_path = os.path.join("uploads", file.name)  # or any subfolder in MEDIA_ROOT
            saved_path = default_storage.save(file_path, ContentFile(file.read()))
            # print("Saved path:", saved_path, type(saved_path))
            sample = ''
            agent = FinancialAnalyticsAPI(claude)
            if(saved_path.split(".")[-1] in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif']):
                try:
                    sample = extract_text_from_image(os.getenv("anthropic_api"), saved_path, "claude-3-7-sonnet-20250219")
                    # print(sample)
                except Exception as e:
                    print(e)
                    return Response({"error": "Error"}, status=500)
            else:
                try:
                    parsed = parser.from_file(saved_path)
                    sample = parsed['content']
                except Exception as e:
                    print(f"Error loading file: {e}")
                    raise e
            
            if len(sample) == 0:
                return Response({"error": "No data found"}, status=400)

            # print(sample)
            with connection.cursor() as cursor:
                cursor.callproc("getAllBudget", [accountID])
                headers = [col[0] for col in cursor.description]
                budgets = cursor.fetchall()
                budgets = [{headers[1]: row[1], headers[3]: row[3]} for row in budgets]
            output = unidecode(get_userData_analysis(sample))
            
            response = Response({"response": output}, status=200)
            
            default_storage.delete(saved_path)

            return response
            
        
        






class getThreadMessageView(APIView):
    '''
    This gets the messages of a view
    '''
    def get(self, request):
        authenticate_user(request)
        print(os.getenv("buss_news_api"))
        thread_id = request.COOKIES.get("thread_id", None)
        if thread_id is None:
            thread_id = client.beta.threads.create().id
            newResponse = Response({"response": "No thread ID found"}, status=200)
            newResponse.set_cookie(
                key="thread_id",
                value=thread_id,
                httponly=True,
                secure=True,
                samesite="Strict",
                path="/",
                # expires=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
                max_age=timedelta(days=7)
            )
            return newResponse
        url1 = f"https://api.openai.com/v1/threads/{thread_id}/messages"
        headersNew = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                "OpenAI-Beta": "assistants=v2"
            }
        response1 = requests.get(url1, headers=headersNew)
        if response1.status_code == 200:
            dictionary = [ele["content"][0]["text"]["value"] for ele in response1.json()["data"]]
            dictionary = [markdown_to_text(unidecode(ele)) for ele in dictionary[-1::-1]]
            dictionary = [ele.split("::++")[1].strip() if "::++" in ele else ele for ele in dictionary]
            # for ele in dictionary:
            #     print(ele)
            #     print()
            # pprint(dictionary)
            
            response = Response({"response": dictionary}, status=200)
            return response
        else:
            return Response({"error": "Error"}, status=500)

class deleteThreadView(APIView):
    def post(self, request):
        authenticate_user(request)
        thread_id = request.COOKIES.get("thread_id", None)
        thread_id = client.beta.threads.create().id
        newResponse = Response({"response": "Thread deleted"}, status=200)
        newResponse.set_cookie(
            key="thread_id",
            value=thread_id,
            httponly=True,
            secure=True,
            samesite="Strict",
            path="/",
            # expires=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
            max_age=timedelta(days=7)
        )
        return newResponse






@api_view(['POST'])
def loginAccount(request):
    # grab the body details
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    isEmail = False
    
    #Check if the account exist in the first place
    if not User.objects.filter(username=username).exists():
        if not User.objects.filter(email=username).exists():
            return Response({"error": "Account does not exist"}, status=404)
        else:
            isEmail = True

    # grab records specifically is_active for that username
    # userRecord = User.objects.filter(username=username).first()
    # serializer = UserSerializer(userRecord, many=False)
    # userRecordData = serializer.data

    # userActiveStatus = userRecordData['is_active']
    # print(userRecordData)
    # if userActiveStatus == 0:
    #     return Response({'error': 'Activate account via email'}, status=401)


    
    # attempt to grab user records
    # print(isEmail)
    if isEmail:
        userRecord = get_object_or_404(User, email=username)
    else:
        userRecord = get_object_or_404(User, username=username)
    # serializer = UserSerializer(userData,many=False)


    # userRecord = User.objects.filter(username=username).first()
    serializer = UserSerializer(userRecord, many=False)
    userRecordData = serializer.data

    userActiveStatus = userRecordData['is_active']
    print(userRecordData)
    if userActiveStatus == 0:
        return Response({'error': 'Activate account via email'}, status=401)

    if not check_password(password, serializer.data['password']):
        return Response({'error': 'invalid password'}, status = 401)
    
    username = serializer.data['username']

    #Account exist and correct password so overall valid credentials
   
    #set the account ID as http only cookie
    
    # Call another api request to receive refresh and access token 
    external_api_url = "http://127.0.0.1:8000/api/token/"
    payload = {
        'username': username,
        'password': password,
    }
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(external_api_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            tokens = response.json()  # Assuming the API returns the tokens in JSON format

            #make sure to create the response

            response = Response({
                'message' : 'Login sucessful',
            }, status=200)

        
            #set refresh token as HTTP-only cookie

            #set refresh token
            response.set_cookie(
                'refresh_token',
                tokens.get('refresh'),
                httponly=True,
                secure=True,
                max_age=timedelta(days=15),
                samesite='Strict'
            )
            response.set_cookie(
                'access_token',
                tokens.get('access'),
                httponly=True,
                secure=True,
                max_age=timedelta(days=15),
                samesite='Strict'
            )
            response.set_cookie(
                'id_info',
                len(str(serializer.data['id'])),
                httponly=True,
                secure=True,
                max_age=timedelta(days=15),
                samesite='Strict'
            )

            response.set_cookie(
                'account_id_hashed',
                str(serializer.data['id'])+hash_account_id(serializer.data['id']),
                httponly=True,
                secure=True,
                max_age=timedelta(days=15),
                samesite='Strict'
            )

            # Return the response with the tokens
            return response
          
        else:
            return Response({"error": "Failed to retrieve tokens from external API"}, status=500)
    
    except requests.exceptions.RequestException as e:
        return Response({"error": f"Error connecting to external API: {str(e)}"}, status=500)

#end of login account API request

class UsernameChangeView(APIView):
    def post(self, request):
        authenticate_user(request)
        data = request.data
        
        password = data.get('password')
        account_id = int(request.COOKIES.get('account_id_hashed')[:int(request.COOKIES.get("id_info"))])
        username = data.get("username")
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=HTTP_400_BAD_REQUEST)
        if len(username) < 4:
            return Response({'error': 'Username ≥ 4 chars'}, status=HTTP_400_BAD_REQUEST)
        if User.objects.filter(id=account_id).exists():
            user = get_object_or_404(User, id=account_id)
            serializer = UserSerializer(user,many=False)

            if not check_password(password, serializer.data['password']):
                return Response({'error': 'invalid password'}, status = 401)
            
            user.username = username
            user.save()
        else:
            return Response({"error": "User not found"}, status=404)
        return Response({"response": "Username changed"}, status=200)
    
class EmailChangeView(APIView):
    def post(self, request):
        authenticate_user(request)
        data = request.data
        password = data.get('password')
        account_id = int(request.COOKIES.get('account_id_hashed')[:int(request.COOKIES.get("id_info"))])
        email = data.get('email')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return Response({'error': 'Invalid email address'}, status=HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=HTTP_400_BAD_REQUEST)
        if User.objects.filter(id=account_id).exists():
            # user = User.objects.get(id=account_id)
            user = get_object_or_404(User, id=account_id)
            serializer = UserSerializer(user,many=False)

            if not check_password(password, serializer.data['password']):
                return Response({'error': 'invalid password'}, status = 401)
            user.email = email
            user.save()
        else:
            return Response({"error": "User not found"}, status=404)
        return Response({"response": "Email changed"}, status=200)
    
class PasswordChangeView(APIView):
    def post(self, request):
        authenticate_user(request)
        data = request.data
        account_id = int(request.COOKIES.get('account_id_hashed')[:int(request.COOKIES.get("id_info"))])
        old_pass = data.get('password')
        password = data.get('newPassword')
        print(password)
        if len(password) < 8:
            return Response({'error': 'Password ≥ 8 chars'}, status=HTTP_400_BAD_REQUEST)
        password = make_password(password)
        print(password)
        if User.objects.filter(id=account_id).exists():
            user = get_object_or_404(User, id=account_id)
            serializer = UserSerializer(user,many=False)

            if not check_password(old_pass, serializer.data['password']):
                return Response({'error': 'invalid password'}, status = 401)
            user = User.objects.get(id=account_id)
            user.password = password
            # user.se
            user.save()
        else:
            return Response({"error": "User not found"}, status=404)
        return Response({"response": "Password changed"}, status=200)
    

    
@api_view(['POST'])
def registerAccount(request):
    try:
        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=HTTP_400_BAD_REQUEST)
        if len(username) < 4:
            return Response({'error': 'Username ≥ 4 chars'}, status=HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({'error': 'Password ≥ 8 chars'}, status=HTTP_400_BAD_REQUEST)
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return Response({'error': 'Invalid email address'}, status=HTTP_400_BAD_REQUEST)


        hashedPassword = make_password(password)
        User.objects.create(username=username, password=hashedPassword, email=email, is_active=0)

        # after creation of account we need to send a verification email 

        userData = User.objects.filter(username=username).first()
        serializer = UserSerializer(userData,many=False)


        return Response({'success': 'User created','user_account': serializer.data}, status=HTTP_201_CREATED)

    except Exception as e:
        print(e)
        return Response({'error': 'Something went wrong'}, status=HTTP_400_BAD_REQUEST)

#END OF REGISTER ACCOUNT

@api_view(['POST'])
def logoutAccount(request):
    #remove refresh token
    response = Response({'success': 'Log out successful'}, status=200)
    response.delete_cookie('refresh_token')
    # response.delete_cookie('account_id')
    response.delete_cookie('access_token')
    response.delete_cookie('account_id_hashed')
    response.delete_cookie('thread_id')
    return response

class AuthenticateView(APIView):
    def get(self, request):
        access_token = request.COOKIES.get("access_token")
        refresh_token = request.COOKIES.get("refresh_token")
        # account_id = request.COOKIES.get("account_id")
        account_id_hashed = request.COOKIES.get("account_id_hashed")
        account_id = int(account_id_hashed[:int(request.COOKIES.get("id_info"))])
        account_id_hashed = account_id_hashed[int(request.COOKIES.get("id_info")):]
        if not check_hashed_account_id(account_id, account_id_hashed):
            raise Response({"error": "Invalid account id"}, status=401)
        print("access token", access_token)
        print("refresh token", refresh_token)
        if access_token and refresh_token:
            try:
                # Validate the access token
                AccessToken(access_token)
                print("Authenticated successfully.")
                return Response({"message": "Authenticated successfully."})
            except Exception:
                if refresh_token:
                    try:
                        # Validate the refresh token
                        response = Response({"message": "Authenticated successfully."})
                        refresh = RefreshToken(refresh_token)
                        response.set_cookie(
                            key="access_token",
                            value=str(refresh.access_token),
                            httponly=True,
                            secure=True,
                            samesite="Strict",
                            path="/",
                            max_age=timedelta(days=15)
                        )
                        # with connection.cursor() as cursor:
                        #     cursor.callproc("insertRefreshToken", [refresh_token, account_id])
                        return response
                    except Exception as e:
                        print("refresh token error", e)
                        return Response({"error": str(e)}, status=401)
                print("No refresh token found.")
                return Response({"error": str(Exception)}, status=401)

        return Response({"error": "Access token and refresh token not found."}, status=401)







# "requires a bearer token that authetnicates this "
@api_view(['POST'])
def addTransaction(request):
    response = Response(status=200) 
    new_access_token = authenticate_user(request)
    response.set_cookie(
        'access_token',
        new_access_token,
        httponly=True,
        secure=True,
        max_age=timedelta(days=15), 
        samesite='Strict'
    )
    accountID = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))]) 
    # Make a copy of request.data because it's immutable
    category = request.data.get('category')
    amount = float(request.data.get('amount'))
    date = request.data.get('date')
    vendor_name = request.data.get('name')


    print(category, amount, date, vendor_name, accountID)

    with connection.cursor() as cursor:
        cursor.callproc("createTransaction", [date, vendor_name, amount, category, accountID])
        cursor.fetchall()
    # response.data["message"] = "Transaction added successfully"
    response.data = {"message": "Transaction added successfully"}
    return response
    # return Response({"message": "Transaction added successfully"}, status=200)






# "API to get specific user "
# "purpose used to set the http cookie to put the transaciton and budge "
# @api_view(['POST'])
# def getAccountID(request):
#     authenticate_user(request)
#     username = request.data.get('username')
#     user = User.objects.filter(username=username).first()

#     response = Response({
#         'set_cookie' : "success",
#         'account_id': user.id

#     }, status=200)

#     response.set_cookie(
#         'account_id',
#         user.id,
#         httponly=True,
#         secure=True,
#         max_age=timedelta(days=15),
#         samesite='Strict'
#     )

#     return response


# @api_view(['POST'])
# def verifyRefreshToken(request):
#     authenticate_user(request)
#     refreshToken = request.COOKIES.get('refresh_token')

#     if(not refreshToken):
#         return Response({"message":"refreshToken does not exist"}, status=404)
#     try:
#         token = RefreshToken(refreshToken)
#         return Response({"message":"refresh token does exist assuming always true "}, status=200)
#     except Exception as e:
#         return Response({"message":"refresh token invalid"}, status=404)


#This is for case where in memory access token is null or empty
@api_view(['POST'])
def resetAccessToken(request):
    authenticate_user(request)
    #valid token as it pass the first case
    refreshToken = request.COOKIES.get('refresh_token')

    url = 'http://127.0.0.1:8000/api/token/refresh/'
    payload = {
        'refresh': refreshToken,
    }
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()  
            
            response = Response({
                'message' : 'Login sucessful',
                'access_token': result.get('access')
            }, status=200)

            return response
          
        else:
            return Response({"error": "refresh token is invalid"}, status=500)
    
    except requests.exceptions.RequestException as e:
        return Response({"error": f"Error connecting to external API: {str(e)}"}, status=500)
    
@api_view(['GET'])
def getCategories(request):
    response = Response(status=200)
    new_access_token = authenticate_user(request)
    response.set_cookie(
        'access_token',
        new_access_token,
        httponly=True,
        secure=True,
        max_age=timedelta(days=15), 
        samesite='Strict'
    )
    with connection.cursor() as cursor:
        cursor.callproc("getAllCategories", [])
        headers = [col[0] for col in cursor.description]
        results = cursor.fetchall()
        results = [{headers[0]: row[0], headers[1]: row[1]} for row in results]
        print("Results:", results)
    response.data = {"categories": results}
    return response
    # return Response({"categories": results}, status=200)


@api_view(['GET'])
def getUserTransactions(request):
    #going have to require a access token and bearer token

    # below was just for testing by query paramter 
    # accountID = request.GET.get("accountID")


    # this would jsut be call with curernt account id in token
    # account ID woould be in the http only cookie
    response = Response(status=200)
    new_access_token = authenticate_user(request)
    response.set_cookie(
        'access_token',
        new_access_token,
        httponly=True,
        secure=True,
        max_age=timedelta(days=15), 
        samesite='Strict'
    )
    accountID = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))]) #account id cookie

    with connection.cursor() as cursor:
        cursor.callproc("getAllTransaction", [accountID])
        headers = [col[0] for col in cursor.description]
        results = cursor.fetchall()
        results = [{headers[0]: row[0], headers[1]: row[1], headers[2]: row[2], headers[3]: row[3], headers[4]: row[4], headers[5]: row[5]} for row in results]
        print("Results:", results)
    response.data = {"transactions": results}
    return response

class CreateBudgetView(APIView):
    def post(self, request):
        account_id = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        response = Response(status=200)
        new_access_token = authenticate_user(request)
        response.set_cookie(
            'access_token',
            new_access_token,
            httponly=True,
            secure=True,
            max_age=timedelta(days=15), 
            samesite='Strict'
        )
        # date = request.data.get('date')
        category = request.data.get('category')
        amount = float(request.data.get('amount'))
        with connection.cursor() as cursor:
            cursor.callproc("createBudget", [amount, account_id, category])
            cursor.fetchall()
        response.data = {"message": "Budget created successfully"}
        return response
    
class GetAllUserBudgetsView(APIView):
    def get(self, request):
        response = Response(status=200)
        new_access_token = authenticate_user(request)
        response.set_cookie(
            'access_token',
            new_access_token,
            httponly=True,
            secure=True,
            max_age=timedelta(days=15), 
            samesite='Strict'
        )
        account_id = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        with connection.cursor() as cursor:
            cursor.callproc("getAllBudget", [account_id])
            headers = [col[0] for col in cursor.description]
            results = cursor.fetchall()
            results = [{headers[1]: row[1], headers[3]: row[3]} for row in results]
            print("Results:", results)
        response.data = {"budgets": results}
        return response
    
class GetUsernameView(APIView):
    def get(self, request):
        response = Response(status=200)
        new_access_token = authenticate_user(request)
        response.set_cookie(
            'access_token',
            new_access_token,
            httponly=True,
            secure=True,
            max_age=timedelta(days=15), 
            samesite='Strict'
        )
        username = User.objects.filter(id=int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))]))
        username = username.first().username if username.exists() else None
        if username is None:
            return Response({"error": "User not found"}, status=404)
        response.data = {"username": username}
        return response
    
class DeleteTransactionView(APIView):
    def post(self, request):
        response = Response(status=200)
        new_access_token = authenticate_user(request)
        account_id = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        response.set_cookie(
            'access_token',
            new_access_token,
            httponly=True,
            secure=True,
            max_age=timedelta(days=15), 
            samesite='Strict'
        )
        body = request.data
        print(body)
        with connection.cursor() as cursor:
            cursor.callproc("deleteTransaction", [body["transaction_name"], body["transaction_date"], float(body["amount"]), int(body["category_id"]), account_id])
            cursor.fetchall()
        response.data = {"message": "Transaction deleted successfully"}
        return response
    
class DeleteBudgetView(APIView):
    def post(self, request):
        response = Response(status=200)
        new_access_token = authenticate_user(request)
        account_id = int(request.COOKIES.get("account_id_hashed")[:int(request.COOKIES.get("id_info"))])
        response.set_cookie(
            'access_token',
            new_access_token,
            httponly=True,
            secure=True,
            max_age=timedelta(days=15), 
            samesite='Strict'
        )
        body = request.data
        with connection.cursor() as cursor:
            cursor.callproc("deleteBudget", [body["amount"], body["category_id"], account_id])
            cursor.fetchall()
        response.data = {"message": "Budget deleted successfully"}
        return response
        


def authenticate_user(request):
    access_token = request.COOKIES.get("access_token")
    refresh_token = request.COOKIES.get("refresh_token")
    # account_id = request.COOKIES.get("account_id")
    account_id_hashed = request.COOKIES.get("account_id_hashed")
    account_id = int(account_id_hashed[:int(request.COOKIES.get("id_info"))])
    print(account_id)
    account_id_hashed = account_id_hashed[int(request.COOKIES.get("id_info")):]
    if not check_hashed_account_id(account_id, account_id_hashed):
        raise Exception("Invalid account id")
    
    if access_token and refresh_token:
        # Validate the access token
        try:
            AccessToken(access_token)
            RefreshToken(refresh_token)
            return access_token
        except Exception:
            # Validate the refresh token
            try:
                refresh_token=RefreshToken(refresh_token)
                return str(refresh_token.access_token)
            except Exception as e:
                print("refresh token error", e)
                raise Exception(str(e))

def hash_account_id(account_id: int) -> str:
    num_value = os.getenv("account_id_salt") + str(account_id)
    return hashlib.sha256(num_value.encode()).hexdigest()

def check_hashed_account_id(account_id: int, account_id_hashed: str) -> bool:
    num_value = os.getenv("account_id_salt") + str(account_id)
    hashed_value = hashlib.sha256(num_value.encode()).hexdigest()
    return hashed_value == account_id_hashed
    


@api_view(['POST'])
def changePasswordRequest(request):
    encodedToken = request.data.get('token')
    password = request.data.get('password')

    #decode the token encoded token
    try:
        decodedToken = jwt.decode(encodedToken, os.getenv('SIGNING_KEY'), algorithms=["HS256"])
    except Exception as e:
        print(f"Error decoding token: {e}")
        return Response("Invalid token", status=400)

    email = decodedToken.get('email')
    accountID = decodedToken.get('accountID')
    purpose = decodedToken.get('purpose')
    expirationPeriodStr = decodedToken.get('expiration')
    expirationPeriod = datetime.fromisoformat(expirationPeriodStr)
    # expirationPeriod = datetime.datetime.fromisoformat(expirationPeriodStr)

    userData = User.objects.filter(id=accountID).first()

    if not userData:
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'Account does not exist'}, status=404)
    
    # so seralizer because we know it exist 
    serializer = UserSerializer(userData,many=False)
    
    # to prevent case sensitivity
    if serializer.data['email'].lower() != email.lower():
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'account is not register with this email'}, status=404)

    # Check if current date is over the expiration date period 
   
    # datetime.datetime.utcnow()
    # if  datetime.datetime.now(datetime.UTC) > expirationPeriod:
    if datetime.now(timezone.utc) > expirationPeriod:
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'activation link expired'}, status=498)
    
    # Check if purpose is tamper in terms of purpose of the token
    elif purpose != 'Change Password':
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'Invalid purpose'}, status=404)
    
    # request pass all test case so we can update the database 
    # user id is_active to a 1 

    hashedPassword = make_password(password)
    userData.password = hashedPassword
    userData.save()

    return Response({'message': 'password reset'}, status=200)

    return render(request, 'account_activated.html', {'email': email})








    


# usecase : user forgets password sends link to the email
@api_view(['POST'])
def sendForgetPasswordEmail(request):
    # import os
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail

    email = request.data.get('email')

    # grab user account 
    userAccount = User.objects.filter(email=email).first()
    serializer = UserSerializer(userAccount, many=False)

    accountID = serializer.data['id']
    purpose = "Change Password"

    # expiration_dt = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
    #expiration_dt = datetime.now(timezone.utc) + timedelta(days=7)
    # Then convert to string (for JSON)
    #expiration_str = expiration_dt.isoformat()


    expiration_dt = datetime.now(timezone.utc) + timedelta(days=7)

    # Then convert to string (for JSON)
    expiration_str = expiration_dt.isoformat()

    tokenBody = {
        "email" : email,
        "accountID" : accountID,
        "purpose" : purpose,
        "expiration" : expiration_str
    }

    #decode the token 
    encodeToken = jwt.encode(tokenBody , os.getenv("SIGNING_KEY"), algorithm="HS256")
   

    
    # generate JWT token within the email
    # personalize jwt with purpose , email , and ID that would be pass from the body

    # link to page component to change password -> parameter of token as well
    # on submision of the page use parameters as token verificaiton for another api 
    message = Mail(
        from_email='stayonbusinessonly@gmail.com',
        to_emails=email,
        subject='FinTrack Password Reset',
        html_content=f''' 
        <h1>Forgot Password </h1>
        <h3>If you\'ve lost your password or wish to reset it, use the link below to get started</h3>
        <a href="http://127.0.0.1:8000/changePassword/?token={encodeToken}"> Reset Password </a>
        <p>If you did not request a password reset , you can safely ignore this email. Only a person with access to your email can reset your account password.</p>
        
        '''
    )
    try:
        
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return Response({"message": "attempt to send forgot password email!"}, status=200)
    except Exception as e:
        print(e.message)
        return Response({"error" :"Cannot send email"}, status=401)


@api_view(['GET'])
def validateAccountActivationToken(request):

    # data is passed in as a parameter
    encodedToken = request.GET.get('token')

    # decode the token 
    decodedToken = jwt.decode(encodedToken, os.getenv('SIGNING_KEY'), algorithms=["HS256"])

    email = decodedToken.get('email')
    accountID = decodedToken.get('accountID')
    purpose = decodedToken.get('purpose')
    expirationPeriodStr = decodedToken.get('expirationPeriod')
    expirationPeriod = datetime.fromisoformat(expirationPeriodStr)
    # expirationPeriod = datetime.datetime.fromisoformat(expirationPeriodStr)




    # grab the record on the database for user registration

    userData = User.objects.filter(id=accountID).first()

    if not userData:
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'Account does not exist'}, status=404)
    
    # so seralizer because we know it exist 
    serializer = UserSerializer(userData,many=False)

    # check if the account is already activated
    if serializer.data['is_active'] == 1:
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error' : 'Account has already been activated'}, status=404)
    
    # to prevent case sensitivity
    if serializer.data['email'].lower() != email.lower():
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'account is not register with this email'}, status=404)

    # Check if current date is over the expiration date period 
   
    # datetime.datetime.utcnow()
    # if  datetime.datetime.now(datetime.UTC) > expirationPeriod:
    if datetime.now(timezone.utc) > expirationPeriod:
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'activation link expired'}, status=498)
    
    # Check if purpose is tamper in terms of purpose of the token
    elif purpose != 'activate account':
        return render(request, 'account_failed.html', {'email': email})
        # return Response({'error': 'Invalid purpose'}, status=404)
    
    # request pass all test case so we can update the database 
    # user id is_active to a 1 

    userData.is_active = 1
    userData.save()

    return render(request, 'account_activated.html', {'email': email})





@api_view(['POST'])
def sendAccountActivationEmail(request):
   

    email = request.data.get('email')
    accountID = request.data.get('id')
    purpose = 'activate account'

    # user have a day or 24 hours to activate their account , so set date as 24 hours from now 
   # Add timedelta first
    # expiration_dt = datetime.datetime.utcnow() + datetime.timedelta(days=1)

    # expiration_dt = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)

    expiration_dt = datetime.now(timezone.utc) + timedelta(days=7)

    # Then convert to string (for JSON)
    expiration_str = expiration_dt.isoformat()


    body = {
        'email' : email,
        'accountID' : accountID,
        'purpose' : purpose,
        'expirationPeriod' : expiration_str
    }

    #encode the token 
    encodeToken = jwt.encode(body , os.getenv("SIGNING_KEY"), algorithm="HS256")
    
    # generate JWT token within the email
    # personalize jwt with purpose , email , and ID that would be pass from the body

    # link would be to a different view that would verification of account
    # adjust the api
    message = Mail(
    from_email='stayonbusinessonly@gmail.com',
    to_emails=email,
    subject='FinTrack account activation',
    html_content=f'''
        <h1>Activate Account</h1>
        <h3>Hello, you have been added to the FinTrack system</h3>
        <a href="http://127.0.0.1:8000/api/validateAccountActivationToken/?token={encodeToken}">Activate account</a>
        <p>To enjoy the service, please click the "Activate Account" link above. The activation link is valid for one day and can only be used once.</p>
    '''
    )

    try:
        
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return Response({"message": "attempt to send email!"}, status=200)
    except Exception as e:
        print(e.message)
        return Response({"error" :"something went wrong"}, status=500)
    

# delete my email
@api_view(['POST'])
def deleteEmail(request):
    data = request.data.get('email')

    instance = User.objects.filter(email=data).first()
    instance.delete()

    return Response({'comment':'deleted the email'},status=200)

@api_view(['GET'])
def getAccount(request):
    data = request.data.get('email')
    
    instance = User.objects.filter(email=data).first()
    serializer = UserSerializer(instance, many=False)

    return Response({'data': serializer.data}, status=200)



