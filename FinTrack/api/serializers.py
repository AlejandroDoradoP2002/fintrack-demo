#create model seralizers response can not native like django model isntances 
# serializer before render it out 

#convert our account model from objects to data types response object can understand

"""
serilaizer in django REST framework ?

- convert complex data types like django model instances into JSON so they can be sent in HTTP responses

- validate and convert JSON or incoming request data into python types to save into the database

bridge between django models and API data(JSON in , JSON out)

"""

from rest_framework import serializers
# from base.models import DummyTable , Categories, Transactions
from django.contrib.auth.models import User #default table 


# create serilizer class be anything but stick with model with the wor serallizer
#inherit from model sesrilizer
# class  DummyTableSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = DummyTable
#         fields = '__all__'


# class CategoriesSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Categories
#         fields= '__all__'


# class TransactionsSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Transactions
#         fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'