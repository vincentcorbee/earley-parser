export const grammarTC39 = [
  /* Types TC39 */

  {
    exp: `TypeArguments :
      AngleBracketedTokens`,
  },
  {
    exp: `TypeDeclaration :
      TYPE BindingIdentifier TypeParameters? EQUAL Type SEMI`,
  },
  {
    exp: `TypeParameters :
      AngleBracketedTokens`,
  },
  {
    exp: `Type :
      ConditionalType
    | NonConditionalType`,
  },
  {
    exp: `ConditionalType :
      NonConditionalType EXTENDS NonConditionalType TENARY Type COLON Type`,
  },
  {
    exp: `NonConditionalType :
      UnionType
    | FunctionType
    | ConstructorType`,
  },
  {
    exp: `UnionType :
      BINOR? IntersectionType
    | UnionType BINOR IntersectionType`,
  },
  {
    exp: `IntersectionType :
      BINAND? TypeOperatorType
    | IntersectionType BINAND TypeOperatorType`,
  },
  {
    exp: `TypeOperatorType :
      READONLY TypeOperatorType
    | KEYOF TypeOperatorType
    | UNIQUE TypeOperatorType
    | INFER TypeOperatorType
    | NOT TypeOperatorType
    | PrimaryType`,
  },
  {
    exp: `PrimaryType :
      ParenthesizedType
    | SquareBracketedType
    | CurlyBracketedType
    | TypeReference
    | ArrayType
    | LiteralType
    | TypeQuery
    | ImportType
    | TypePredicate
    | THIS
    | VOID`,
  },
  {
    exp: `ParenthesizedType :
      ParenthesizedTokens`,
  },
  {
    exp: `SquareBracketedType :
      SquareBracketedTokens`,
  },
  {
    exp: `CurlyBracketedType :
      CurlyBracketedTokens`,
  },
  {
    exp: `TypeReference :
      TypeName TypeArguments?`,
  },
  {
    exp: `TypeName :
      Identifier
    | TypeName DOT Identifier`,
  },
  {
    exp: `ArrayType :
      PrimaryType LBRACK RBRACK`,
  },
  {
    exp: `LiteralType :
      NumericLiteralType
    | StringLiteral
    | TemplateLiteralType
    | TRUE
    | FALSE
    | NULL`,
  },
  {
    exp: `TemplateLiteralType :
      NoSubstitutionTemplate
    | TemplateBracketedTokens`,
  },
  {
    exp: `NumericLiteralType :
      NumericLiteral
    | MINUS NumericLiteral`,
  },
  {
    exp: `TypeQuery :
      TYPEOF EntityName`,
  },
  {
    exp: `EntityName :
      IdentifierName
    | ImportSpecifier
    | EntityName DOT IdentifierName
    | EntityName DOUBLECOLON TypeArguments`,
  },
  {
    exp: `ImportSpecifier :
      IMPORT LPAREN ModuleSpecifier RPAREN`,
  },
  {
    exp: `ImportType :
      ImportSpecifier
    | ImportSpecifier DOT TypeName`,
  },
  {
    exp: `TypePredicate :
      IdentifierOrThis IS Type
    | ASSERTS IdentifierOrThis
    | ASSERTS IdentifierOrThis IS Type`,
  },
  {
    exp: `IdentifierOrThis :
      Identifier
    | THIS`,
  },
  {
    exp: `FunctionType :
      TypeParameters? ParameterList ARROW Type`,
  },
  {
    exp: `ConstructorType :
      NEW TypeParametersopt ParameterList ARROW Type`,
  },
  {
    exp: `ParameterList :
      ParenthesizedTokens`,
  },
  {
    exp: `InterfaceDeclaration :
      INTERFACE BindingIdentifier TypeParameters? InterfaceExtendsClause? InterfaceBody`,
  },
  {
    exp: `InterfaceExtendsClause :
      EXTENDS ClassOrInterfaceTypeList`,
  },
  {
    exp: `ClassOrInterfaceTypeList :
      TypeReference
    | ClassOrInterfaceTypeList COMMA TypeReference`,
  },
  {
    exp: `InterfaceBody :
      CurlyBracketedTokens`,
  },
  {
    exp: `TypeAnnotation :
      COLON Type`,
  },
  {
    exp: `AbstractModifier :
      ABSTRACT`,
  },
  {
    exp: `ClassImplementsClause :
      IMPLEMENTS ClassOrInterfaceTypeList`,
  },
  {
    exp: `AccessibilityModifier :
      PUBLIC
    | PROTECTED
    | PRIVATE`,
  },
  {
    exp: `OverrideModifier :
      OVERRIDE`,
  },
  {
    exp: `AbstractClassElement :
      AccessibilityModifier? ABSCTRACT OverrideModifier? AbstractMethodDefinition
    | AccessibilityModifier? ABSCTRACT AbstractFieldDefinition`,
  },
  {
    exp: `AbstractMethodDefinition :
      ClassElementName TypeParameters? LPAREN UniqueFormalParameters RPAREN TypeAnnotation?
    | GET ClassElementName LPAREN RPAREN TypeAnnotation?
    | SET ClassElementName LPAREN PropertySetParameterList RPAREN`,
  },
  {
    exp: `AbstractFieldDefinition :
      ClassElementName OptionalModifier? TypeAnnotation?`,
  },
  {
    exp: `IndexSignature :
      LBRACK BindingIdentifier TypeAnnotation RBRACK TypeAnnotation`,
  },
  {
    exp: `BracketedTokens :
      ParenthesizedTokens
    | SquareBracketedTokens
    | CurlyBracketedTokens
    | AngleBracketedTokens
    | TemplateBracketedTokens`,
  },
  {
    exp: `ParenthesizedTokens :
      LPAREN TokenBody? RPAREN`,
  },
  {
    exp: `SquareBracketedTokens :
      LBRACK TokenBody? RBRACK`,
  },
  {
    exp: `CurlyBracketedTokens :
      LCBRACE TokenBody? RCBRACE`,
  },
  {
    exp: `AngleBracketedTokens :
      LANGLEBRACKET TokenBody? RANGLEBRACKET`,
  },
  {
    exp: `TemplateBracketedTokens :
      TemplateHead TemplateTokenBody TemplateTail`,
  },
  {
    exp: `TemplateTokenBody :
      TokenBody
    | TokenBody TemplateMiddle TemplateTokenBody`,
  },
  {
    exp: `TokenBody :
      TokenOrBracketedTokens TokenBody?`,
  },
  {
    exp: `TokenOrBracketedTokens :
      NonBracketedToken
    | BracketedTokens`,
  },
  {
    exp: `NonBracketedToken :
      CommonToken
    | NonBracketedToken CommonToken`,
  },
  {
    exp: `OptionalModifier :
      TENARY`,
  },
  {
    exp: `CommonToken :
      IdentifierName
    | Punctuator
    | StringLiteral
    | NULL`,
  },
  {
    exp: `Punctuator :
      OptionalChainingPunctuator
    | OtherPunctuator`,
  },
  {
    exp: `OptionalChainingPunctuator :
      "?."`,
  },
  {
    exp: `OptionalChainingPunctuator :
      "?."`,
  },
  {
    exp: `OtherPunctuator :
      OTHER_PUNCTUATOR`,
  },
]
