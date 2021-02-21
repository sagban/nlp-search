import logging
import json
import azure.functions as func
from nltk.corpus import wordnet as wn
import nltk
from PyDictionary import PyDictionary
nltk.download('wordnet')

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    word = req.params.get('word')
    if not word:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            word = req_body.get('word')

    if word:
        synsets = wn.synsets(word, pos='n')
        similar_words = []
        if len(synsets) > 0:
            synset = synsets[0]
            # Get the hypernym for this synset (again, take the first)
            hypernyms = synset.hypernyms()
            if len(hypernyms) > 0:
                hypernym = hypernyms[0]
                # Get some hyponyms from this hypernym
                hyponyms = hypernym.hyponyms()
                # Take the name of the first lemma for the first 8 hyponyms
                for hyponym in hyponyms:
                    similar_word = hyponym.lemmas()[0].name().replace('_', ' ').replace('-', ' ')
                    if similar_word != word:
                        similar_words.append(similar_word)
                    if len(similar_words) == 4:
                        break
        dictionary = PyDictionary(word)
        synonyms = dictionary.getSynonyms()
        if len(synonyms) > 0 and synonyms[0] is not None and word in synonyms[0].keys() :
            answer = synonyms[0][word]
            print(answer)
            similar_words = similar_words + answer
        
        opposite_words = []
        antonyms = dictionary.getAntonyms()
        if len(antonyms) > 0 and antonyms[0] is not None and word in antonyms[0].keys():
            opposite_words = antonyms[0][word]
        result = {
            "synms": similar_words[:8],
             "antms": opposite_words
        }
        return func.HttpResponse(json.dumps(result), mimetype="application/json", status_code=200)
    else:
        return func.HttpResponse(
             "This HTTP triggered function executed successfully. Pass a word in the query string or in the request body for a personalized response.",
             status_code=201
        )
