from django.urls import path, include
from .views import (chatAssistantView, getThreadMessageView, deleteThreadView, CreateBudgetView, GetAllUserBudgetsView, GetUsernameView,
DeleteTransactionView, DeleteBudgetView, UsernameChangeView, EmailChangeView, PasswordChangeView, QuickAnalysisView)# Ensure this is the correct import for your view class
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

"""
Default:
access token : 5 minutes
refresh token : 1 day / 24 hours 

"""
urlpatterns = [
    path("chat/", chatAssistantView.as_view(), name="chat_with_fa_assistant"),
    path("getMessages/", getThreadMessageView.as_view(), name="chat_get_messages"),
    path("deleteThread/", deleteThreadView.as_view(), name="chat_delete_thread"),

    path('getUsername/', GetUsernameView.as_view(), name="get_username"),
    path('changeUsername/', UsernameChangeView.as_view(), name="change_username"),
    path('changeEmail/', EmailChangeView.as_view(), name="change_email"),
    path('changePassword/', PasswordChangeView.as_view(), name="change_password"),

    path('quickAnalyze/', QuickAnalysisView.as_view(), name="quick_analysis"),

    path('changePasswordRequest/',views.changePasswordRequest),
    path('sendForgetPasswordEmail/', views.sendForgetPasswordEmail),
    path('sendAccountActivationEmail/',views.sendAccountActivationEmail),
    path('validateAccountActivationToken/', views.validateAccountActivationToken),
    path('registerAccount/',views.registerAccount),
    path('loginAccount/',views.loginAccount),
    path('logoffAccount/',views.logoutAccount),
    path('getCategories/',views.getCategories),
    path('addTransaction/',views.addTransaction),
    path('deleteTransaction/', DeleteTransactionView.as_view(), name='delete_transaction'),
    path('createBudget/', CreateBudgetView.as_view(), name='create_budget'),
    path('getUserBudgets/', GetAllUserBudgetsView.as_view(), name='get_user_budgets'),
    path('deleteBudget/', DeleteBudgetView.as_view(), name='delete_budget'),
    # path('getAccountID',views.getAccountID),
    path('getUserTransactions/',views.getUserTransactions),
    path('resetAccessToken/', views.resetAccessToken),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('authenticate/', views.AuthenticateView.as_view(), name='authenticate'),
    path('deleteEmail',views.deleteEmail),
    path('getAccount',views.getAccount)
]




"""

1. first api request is to generate the access and refresh token
2. second api request is going to generate a new access token
    - access token is short term and renew it within the http cookie only 
    - question of like what about the refresh token . means user is going to be log off and have to 
        regenerate both tokens again


notes for the token it is linked to the auth user table 

"""